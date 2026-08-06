from fastapi import APIRouter, Depends, UploadFile, File, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.list_definition import (
    ListDefinitionCreate, ListDefinitionUpdate, ListDefinitionResponse,
    ListRecordCreate, ListRecordResponse,
)
from app.services.list_service import (
    create_list_definition, get_list_definitions, get_list_definition,
    update_list_definition, delete_list_definition,
)
from app.services.record_service import add_record, get_records, get_record, update_record, delete_record
from app.services.excel_service import import_records_from_excel
from app.services.auth_service import get_current_user, require_role
from app.models.list_definition import ListRecord
from app.models.user import User
import os
from app.core.config import settings

router = APIRouter(prefix="/lists", tags=["Listas"])


@router.post("/", response_model=dict)
def create_list(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    from app.schemas.list_definition import ListDefinitionCreate
    from app.services.list_service import create_list_definition
    cols = [{"key": c["key"], "label": c["label"], "type": c.get("type", "text")} for c in data["columns_config"]]
    schema = ListDefinitionCreate(name=data["name"], description=data.get("description"), columns_config=cols)
    ld = create_list_definition(db, schema, current_user.id)
    return {"id": str(ld.id), "name": ld.name, "message": "Lista creada correctamente"}


@router.get("/")
def list_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.list_service import get_list_definitions
    lists = get_list_definitions(db)
    return [
        {
            "id": str(ld.id),
            "name": ld.name,
            "description": ld.description,
            "columns_config": ld.columns_config,
            "is_system": ld.is_system,
            "created_by": str(ld.created_by),
            "created_at": str(ld.created_at),
        }
        for ld in lists
    ]


@router.get("/{list_id}", response_model=dict)
def get_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.list_service import get_list_definition
    ld = get_list_definition(db, list_id)
    return {
        "id": str(ld.id),
        "name": ld.name,
        "description": ld.description,
        "columns_config": ld.columns_config,
        "is_system": ld.is_system,
        "created_by": str(ld.created_by),
        "created_at": str(ld.created_at),
    }


@router.put("/{list_id}")
def update_list(
    list_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    from app.schemas.list_definition import ListDefinitionUpdate
    from app.services.list_service import update_list_definition
    update_data = ListDefinitionUpdate(**data)
    ld = update_list_definition(db, list_id, update_data, current_user.role)
    return {"message": "Lista actualizada correctamente"}


@router.delete("/{list_id}")
def delete_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    from app.services.list_service import delete_list_definition
    delete_list_definition(db, list_id, current_user.role)
    return {"message": "Lista eliminada correctamente"}


@router.get("/{list_id}/export-expediente")
def export_expediente(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.list_service import get_list_definition
    from app.services.record_service import get_records
    from app.services.expediente_service import export_expediente_excel

    from fastapi.responses import FileResponse
    import os
    ld = get_list_definition(db, list_id)
    records = get_records(db, list_id)
    os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.EXPORTS_DIR, f"expediente_{list_id}.xlsx")
    logo_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'logo_sbj.png')
    export_expediente_excel(records, filepath, logo_path)
    return FileResponse(filepath, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=f"Expediente_{ld.name}.xlsx")


@router.get("/{list_id}/especialidades")
def list_especialidades(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.record_service import get_distinct_field_values
    return get_distinct_field_values(db, list_id, "especialidad")


@router.get("/{list_id}/localidades")
def list_localidades(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import text
    rows = db.execute(text(
        "SELECT data->>'localidad' AS loc, data->>'tipo_localidad' AS tipo, COUNT(*) AS n "
        "FROM list_records "
        "WHERE list_definition_id = :lid AND data->>'localidad' IS NOT NULL AND data->>'localidad' != '' "
        "GROUP BY loc, tipo ORDER BY loc"
    ), {"lid": list_id}).all()
    return [{"localidad": r[0], "tipo": r[1] or "", "count": r[2]} for r in rows]


@router.get("/{list_id}/field-values")
def list_field_values(
    list_id: int,
    field: str = "perfil",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.record_service import get_distinct_field_values
    return get_distinct_field_values(db, list_id, field)


@router.post("/{list_id}/export-expediente-selected")
def export_expediente_selected(
    list_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.list_service import get_list_definition
    from app.services.record_service import get_records_by_ids
    from app.services.expediente_service import export_expediente_excel
    from fastapi.responses import FileResponse
    import re
    import os
    ids = data.get("ids", [])
    ld = get_list_definition(db, list_id)
    records = get_records_by_ids(db, ids) if ids else []
    os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.EXPORTS_DIR, f"expediente_selected_{list_id}.xlsx")
    logo_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'logo_sbj.png')
    export_expediente_excel(records, filepath, logo_path)

    if len(records) == 1:
        r = records[0].data
        nombre = re.sub(r'[\\/*?:"<>|]', '', str(r.get('nombre', '')).strip().replace(' ', '_'))
        apellido = re.sub(r'[\\/*?:"<>|]', '', str(r.get('apellido', '')).strip().replace(' ', '_'))
        especialidad = re.sub(r'[\\/*?:"<>|]', '', str(r.get('especialidad', '')).strip().replace(' ', '_'))
        base = f"{nombre}_{apellido}"
        if especialidad:
            base += f"_{especialidad}"
        filename = f"{base}.xlsx"
    else:
        filename = f"Expedientes_Seleccionados.xlsx"

    return FileResponse(filepath, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=filename)


@router.post("/{list_id}/import-excel")
def import_excel(
    list_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_filename = os.path.basename(file.filename or "import.xlsx")
    if not safe_filename:
        safe_filename = "import.xlsx"
    file_path = os.path.join(settings.UPLOAD_DIR, f"import_{list_id}_{safe_filename}")
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    count = import_records_from_excel(db, list_id, file_path)
    return {"message": f"Se importaron {count} registros correctamente", "count": count}


@router.get("/{list_id}/export-excel")
def export_list_excel(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.list_service import get_list_definition
    from app.services.record_service import count_records, get_records
    from app.services.excel_service import export_to_excel, export_to_excel_stream
    from fastapi.responses import FileResponse
    import os
    ld = get_list_definition(db, list_id)
    columns = [c["label"] for c in ld.columns_config]
    total = count_records(db, list_id)
    os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.EXPORTS_DIR, f"export_lista_{list_id}.xlsx")
    STREAM_THRESHOLD = 20000
    BATCH_SIZE = 5000
    if total > STREAM_THRESHOLD:
        def gen_rows():
            for skip in range(0, total, BATCH_SIZE):
                batch = get_records(db, list_id, skip, BATCH_SIZE)
                for r in batch:
                    yield r.data
        export_to_excel_stream(gen_rows(), columns, filepath, title=ld.name, count=total)
    else:
        records = get_records(db, list_id, 0, total)
        data = [r.data for r in records]
        export_to_excel(data, columns, filepath, title=ld.name, count=total)
    return FileResponse(filepath, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=f"lista_{ld.name}.xlsx")


@router.get("/{list_id}/records/count")
def count_records(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.record_service import count_records
    return {"count": count_records(db, list_id)}


@router.get("/{list_id}/records/suggest-number")
def suggest_number(
    list_id: int,
    identidad: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.record_service import suggest_expediente
    number = suggest_expediente(db, list_id, identidad.strip())
    return {"identidad": identidad.strip(), "expediente": number or ""}


@router.get("/{list_id}/records/duplicates")
def list_duplicate_identidades(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import text
    rows = db.execute(text(
        "SELECT data->>'identidad' AS identidad, array_agg(id) AS ids "
        "FROM list_records "
        "WHERE list_definition_id = :lid AND data->>'identidad' IS NOT NULL AND data->>'identidad' != '' "
        "GROUP BY data->>'identidad' HAVING COUNT(*) > 1 "
        "ORDER BY COUNT(*) DESC"
    ), {"lid": list_id}).all()
    result = []
    for r in rows:
        ids = list(r[1])
        recs = db.query(ListRecord).filter(ListRecord.id.in_(ids)).all()
        result.append({
            "identidad": r[0],
            "count": len(ids),
            "record_ids": [str(x.id) for x in recs],
            "nombres": [
                f"{x.data.get('nombre', '')} {x.data.get('apellido', '')}".strip() or "Sin nombre"
                for x in recs
            ],
        })
    return result


@router.get("/{list_id}/records/by-ids")
def list_records_by_ids(
    list_id: int,
    ids: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.record_service import get_records_by_ids
    id_list = [int(x) for x in ids.split(",") if x.strip().isdigit()]
    records = get_records_by_ids(db, id_list)
    return [
        {
            "id": str(r.id),
            "list_definition_id": str(r.list_definition_id),
            "data": r.data,
            "created_by": str(r.created_by) if r.created_by else None,
            "created_at": str(r.created_at),
        }
        for r in records
    ]


@router.get("/{list_id}/records")
def list_records(
    list_id: int,
    skip: int = 0,
    limit: int = 1000,
    search: str = None,
    search_field: str = None,
    page: int = None,
    page_size: int = None,
    exclude_statuses: str = None,
    waiting_only: bool = False,
    estatus_cirugia: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if page_size is not None:
        from app.services.record_service import paginate_records
        page = page or 1
        excluded = [s.strip() for s in (exclude_statuses or "").split(",") if s.strip()]
        items, total = paginate_records(
            db, list_id, search, search_field, page, page_size,
            exclude_statuses=excluded or None, waiting_only=waiting_only,
            estatus_cirugia=estatus_cirugia or None,
        )

        def ser(r):
            return {
                "id": str(r.id),
                "list_definition_id": str(r.list_definition_id),
                "data": r.data,
                "created_by": str(r.created_by) if r.created_by else None,
                "created_at": str(r.created_at),
            }

        return {
            "items": [ser(r) for r in items],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    from app.services.record_service import get_records
    records = get_records(db, list_id, skip, limit, search, search_field)
    return [
        {
            "id": str(r.id),
            "list_definition_id": str(r.list_definition_id),
            "data": r.data,
            "created_by": str(r.created_by) if r.created_by else None,
            "created_at": str(r.created_at),
        }
        for r in records
    ]


@router.post("/{list_id}/records")
def create_record(
    list_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi import HTTPException
    from app.services.record_service import add_record
    if current_user.role not in ("admin", "direccion", "direccion_medica", "medico"):
        raise HTTPException(status_code=403, detail="No tienes permisos para crear expedientes")
    record = add_record(db, list_id, data.get("data", data), user_id=current_user.id)
    return {"id": str(record.id), "message": "Registro creado correctamente"}


@router.put("/{list_id}/records/{record_id}")
def update_record_endpoint(
    list_id: int,
    record_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.record_service import update_record
    if current_user.role not in ("admin", "direccion", "direccion_medica") and current_user.role != "medico":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")
    update_record(db, record_id, data.get("data", data), user_id=current_user.id, user_role=current_user.role)
    return {"message": "Registro actualizado correctamente"}


@router.delete("/{list_id}/records/{record_id}")
def delete_record_endpoint(
    list_id: int,
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.record_service import delete_record
    delete_record(db, record_id, user_id=current_user.id, user_role=current_user.role)
    return {"message": "Registro eliminado correctamente"}


@router.post("/{list_id}/records/bulk-delete")
def bulk_delete_records_endpoint(
    list_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi import HTTPException
    from app.services.record_service import delete_record
    ids = payload.get("ids", [])
    deleted = 0
    errors = []
    for record_id in ids:
        try:
            delete_record(db, record_id, user_id=current_user.id, user_role=current_user.role)
            deleted += 1
        except HTTPException as e:
            errors.append({"id": record_id, "detail": e.detail})
    message = f"{deleted} registro(s) eliminado(s)"
    if errors:
        message += f", {len(errors)} no eliminado(s) por permisos"
    return {"message": message, "deleted": deleted, "errors": errors}




