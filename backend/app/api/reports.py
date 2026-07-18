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


@router.post("/")
def create_report(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion")),
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
    return {"id": report.id, "message": "Reporte creado correctamente"}


@router.get("/")
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "list_definition_id": r.list_definition_id,
            "created_by": r.created_by,
            "file_path_excel": r.file_path_excel,
            "file_path_pdf": r.file_path_pdf,
            "created_at": str(r.created_at),
        }
        for r in reports
    ]


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
        "id": report.id,
        "name": report.name,
        "description": report.description,
        "list_definition_id": report.list_definition_id,
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
    current_user: User = Depends(require_role("admin", "direccion")),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    from app.models.list_definition import ListDefinition, ListRecord
    ld = db.query(ListDefinition).filter(ListDefinition.id == report.list_definition_id).first()
    if not ld:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    columns = [c["label"] for c in ld.columns_config]
    if report.columns_selected:
        columns = report.columns_selected
    records = db.query(ListRecord).filter(ListRecord.list_definition_id == report.list_definition_id).all()
    data = [r.data for r in records]
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.REPORTS_DIR, f"reporte_{report.id}.xlsx")
    from app.services.excel_service import export_to_excel
    export_to_excel(data, columns, filepath)
    report.file_path_excel = filepath
    db.commit()
    return {"message": "Reporte Excel generado", "file_path": filepath}


@router.post("/{report_id}/generate-pdf")
def generate_pdf_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion")),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    from app.models.list_definition import ListDefinition, ListRecord
    ld = db.query(ListDefinition).filter(ListDefinition.id == report.list_definition_id).first()
    if not ld:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    columns = [c["label"] for c in ld.columns_config]
    if report.columns_selected:
        columns = report.columns_selected
    records = db.query(ListRecord).filter(ListRecord.list_definition_id == report.list_definition_id).all()
    data = [r.data for r in records]
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.REPORTS_DIR, f"reporte_{report.id}.pdf")
    export_to_pdf(data, columns, report.name, filepath)
    report.file_path_pdf = filepath
    db.commit()
    return {"message": "PDF generado correctamente", "file_path": filepath}


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
    current_user: User = Depends(require_role("admin", "direccion")),
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
