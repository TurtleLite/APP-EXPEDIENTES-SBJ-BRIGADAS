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
from app.models.user import User
import os
from app.core.config import settings

router = APIRouter(prefix="/lists", tags=["Listas"])


@router.post("/", response_model=dict)
def create_list(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion")),
):
    from app.schemas.list_definition import ListDefinitionCreate
    from app.services.list_service import create_list_definition
    cols = [{"key": c["key"], "label": c["label"], "type": c.get("type", "text")} for c in data["columns_config"]]
    schema = ListDefinitionCreate(name=data["name"], description=data.get("description"), columns_config=cols)
    ld = create_list_definition(db, schema, current_user.id)
    return {"id": ld.id, "name": ld.name, "message": "Lista creada correctamente"}


@router.get("/")
def list_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.list_service import get_list_definitions
    lists = get_list_definitions(db)
    return [
        {
            "id": ld.id,
            "name": ld.name,
            "description": ld.description,
            "columns_config": ld.columns_config,
            "is_system": ld.is_system,
            "created_by": ld.created_by,
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
        "id": ld.id,
        "name": ld.name,
        "description": ld.description,
        "columns_config": ld.columns_config,
        "is_system": ld.is_system,
        "created_by": ld.created_by,
        "created_at": str(ld.created_at),
    }


@router.put("/{list_id}")
def update_list(
    list_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion")),
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
    current_user: User = Depends(require_role("admin", "direccion")),
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
    import os
    ids = data.get("ids", [])
    ld = get_list_definition(db, list_id)
    records = get_records_by_ids(db, ids) if ids else []
    os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.EXPORTS_DIR, f"expediente_selected_{list_id}.xlsx")
    logo_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'logo_sbj.png')
    export_expediente_excel(records, filepath, logo_path)
    return FileResponse(filepath, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=f"Expediente_{ld.name}_seleccion.xlsx")


@router.post("/{list_id}/import-excel")
def import_excel(
    list_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion")),
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, f"import_{list_id}_{file.filename}")
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
    from app.services.record_service import get_records
    from app.services.excel_service import export_to_excel
    from fastapi.responses import FileResponse
    import os
    ld = get_list_definition(db, list_id)
    columns = [c["label"] for c in ld.columns_config]
    records = get_records(db, list_id)
    data = [r.data for r in records]
    os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.EXPORTS_DIR, f"export_lista_{list_id}.xlsx")
    export_to_excel(data, columns, filepath)
    return FileResponse(filepath, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=f"lista_{ld.name}.xlsx")


@router.get("/{list_id}/records")
def list_records(
    list_id: int,
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    search_field: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.record_service import get_records
    records = get_records(db, list_id, skip, limit, search, search_field)
    return [
        {
            "id": r.id,
            "list_definition_id": r.list_definition_id,
            "data": r.data,
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
    from app.services.record_service import add_record
    record = add_record(db, list_id, data.get("data", data))
    return {"id": record.id, "message": "Registro creado correctamente"}


@router.put("/{list_id}/records/{record_id}")
def update_record_endpoint(
    list_id: int,
    record_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion")),
):
    from app.services.record_service import update_record
    update_record(db, record_id, data.get("data", data))
    return {"message": "Registro actualizado correctamente"}


@router.delete("/{list_id}/records/{record_id}")
def delete_record_endpoint(
    list_id: int,
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "direccion")),
):
    from app.services.record_service import delete_record
    delete_record(db, record_id)
    return {"message": "Registro eliminado correctamente"}



