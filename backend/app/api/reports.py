from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.report import Report
from app.models.list_definition import ListDefinition, ListRecord
from app.services.auth_service import get_current_user, require_role
from app.models.user import User
from app.services.excel_service import export_to_excel
from app.services.pdf_service import export_to_pdf
import os

router = APIRouter(prefix="/reports", tags=["Reportes"])


def _records_for_report(db: Session, report: Report):
    filt = report.filters or {}
    conds = []
    params = {"lid": report.list_definition_id}

    especialidad = filt.get("especialidad")
    if especialidad:
        conds.append("data->>'especialidad' = :esp")
        params["esp"] = especialidad

    perfil = filt.get("perfil")
    if perfil:
        conds.append("data->>'perfil' = :perf")
        params["perf"] = perfil

    estatus = filt.get("estatus_cirugia")
    if estatus:
        conds.append("data->>'estatus_cirugia' = :estat")
        params["estat"] = estatus

    nombre = (filt.get("nombre") or "").strip()
    if nombre:
        conds.append("(data->>'nombre' ILIKE :nom OR data->>'apellido' ILIKE :nom)")
        params["nom"] = f"%{nombre}%"

    fecha_inicio = filt.get("fecha_inicio")
    if fecha_inicio:
        conds.append("data->>'fecha_elaboracion' >= :fini")
        params["fini"] = fecha_inicio

    fecha_fin = filt.get("fecha_fin")
    if fecha_fin:
        conds.append("data->>'fecha_elaboracion' <= :ffin")
        params["ffin"] = fecha_fin

    edad_min = filt.get("edad_min")
    if edad_min not in (None, ""):
        conds.append("NULLIF(REGEXP_REPLACE(data->>'edad', '[^0-9]', '', 'g'), '')::int >= :emin")
        params["emin"] = int(edad_min)

    edad_max = filt.get("edad_max")
    if edad_max not in (None, ""):
        conds.append("NULLIF(REGEXP_REPLACE(data->>'edad', '[^0-9]', '', 'g'), '')::int <= :emax")
        params["emax"] = int(edad_max)

    if not conds:
        return db.query(ListRecord).filter(ListRecord.list_definition_id == report.list_definition_id).all()
    from sqlalchemy import text
    sql = text(f"SELECT id FROM list_records WHERE list_definition_id = :lid AND {' AND '.join(conds)}")
    ids = db.execute(sql, params).scalars().all()
    return db.query(ListRecord).filter(ListRecord.id.in_(ids)).all()


def _column_pairs(ld: ListDefinition, report: Report) -> list[tuple[str, str]]:
    config = ld.columns_config
    label_to_key = {c["label"]: c["key"] for c in config}
    key_to_label = {c["key"]: c["label"] for c in config}
    if report.columns_selected:
        pairs = []
        for sel in report.columns_selected:
            if sel in label_to_key:
                pairs.append((sel, label_to_key[sel]))
            elif sel in key_to_label:
                pairs.append((key_to_label[sel], sel))
        if pairs:
            return pairs
    return [(c["label"], c["key"]) for c in config]


def _report_rows(records: list[ListRecord], pairs: list[tuple[str, str]]) -> list[dict]:
    rows = []
    for rec in records:
        d = rec.data or {}
        rows.append({label: d.get(key, "") for label, key in pairs})
    return rows


@router.post("/")
def create_report(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion", "direccion_medica")),
):
    report = Report(
        name=data["name"],
        description=data.get("description"),
        list_definition_id=data.get("list_definition_id"),
        filters=data.get("filters"),
        columns_selected=data.get("columns_selected"),
        created_by=current_user.id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"id": str(report.id), "message": "Reporte creado correctamente"}


@router.get("/")
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    result = []
    for r in reports:
        record_count = 0
        if r.list_definition_id:
            record_count = len(_records_for_report(db, r))
        result.append({
            "id": str(r.id),
            "name": r.name,
            "description": r.description,
            "list_definition_id": str(r.list_definition_id) if r.list_definition_id else None,
            "filters": r.filters,
            "created_by": str(r.created_by),
            "file_path_excel": r.file_path_excel,
            "file_path_pdf": r.file_path_pdf,
            "created_at": str(r.created_at),
            "record_count": record_count,
        })
    return result


@router.get("/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return {
        "id": str(report.id),
        "name": report.name,
        "description": report.description,
        "list_definition_id": str(report.list_definition_id) if report.list_definition_id else None,
        "filters": report.filters,
        "columns_selected": report.columns_selected,
        "file_path_excel": report.file_path_excel,
        "file_path_pdf": report.file_path_pdf,
        "created_at": str(report.created_at),
    }


@router.post("/{report_id}/generate-excel")
def generate_excel_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion", "direccion_medica")),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    from app.models.list_definition import ListDefinition, ListRecord
    ld = db.query(ListDefinition).filter(ListDefinition.id == report.list_definition_id).first()
    if not ld:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    pairs = _column_pairs(ld, report)
    columns = [label for label, _ in pairs]
    records = _records_for_report(db, report)
    data = _report_rows(records, pairs)
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.REPORTS_DIR, f"reporte_{report.id}.xlsx")
    from app.services.excel_service import export_to_excel
    export_to_excel(data, columns, filepath)
    report.file_path_excel = filepath
    db.commit()
    return {"message": "Reporte Excel generado", "file_path": filepath, "count": len(data)}


@router.post("/{report_id}/generate-pdf")
def generate_pdf_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion", "direccion_medica")),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    from app.models.list_definition import ListDefinition, ListRecord
    ld = db.query(ListDefinition).filter(ListDefinition.id == report.list_definition_id).first()
    if not ld:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    pairs = _column_pairs(ld, report)
    columns = [label for label, _ in pairs]
    records = _records_for_report(db, report)
    data = _report_rows(records, pairs)
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.REPORTS_DIR, f"reporte_{report.id}.pdf")
    export_to_pdf(data, columns, report.name, filepath, filters=report.filters, count=len(data))
    report.file_path_pdf = filepath
    db.commit()
    return {"message": "PDF generado correctamente", "file_path": filepath, "count": len(data)}


@router.get("/{report_id}/preview")
def preview_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    from app.models.list_definition import ListDefinition, ListRecord
    ld = db.query(ListDefinition).filter(ListDefinition.id == report.list_definition_id).first()
    if not ld:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    pairs = _column_pairs(ld, report)
    columns = [label for label, _ in pairs]
    records = _records_for_report(db, report)
    rows = _report_rows(records, pairs)
    return {
        "name": report.name,
        "description": report.description,
        "filters": report.filters,
        "columns": columns,
        "count": len(rows),
        "records": rows[:200],
    }


@router.get("/{report_id}/download/{file_type}")
def download_report(
    report_id: int,
    file_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    file_path = report.file_path_excel if file_type == "excel" else report.file_path_pdf
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado. Genere el reporte primero.")
    media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if file_type == "excel" else "application/pdf"
    return FileResponse(file_path, media_type=media_type, filename=os.path.basename(file_path))


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion", "direccion_medica")),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    for f in [report.file_path_excel, report.file_path_pdf]:
        if f and os.path.exists(f):
            os.remove(f)
    db.delete(report)
    db.commit()
    return {"message": "Reporte eliminado correctamente"}
