from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from app.models.list_definition import ListRecord, ListDefinition
from typing import Optional


def add_record(db: Session, list_id: int, data: dict, user_id: int = None) -> ListRecord:
    record = ListRecord(list_definition_id=list_id, data=data, created_by=user_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_records(db: Session, list_id: int, skip: int = 0, limit: int = 100,
                search: Optional[str] = None, search_field: Optional[str] = None) -> list[ListRecord]:
    query = db.query(ListRecord).filter(ListRecord.list_definition_id == list_id)
    if search and search_field:
        query = query.filter(
            ListRecord.data[search_field].as_string().ilike(f"%{search}%")
        )
    elif search:
        query = query.filter(
            cast(ListRecord.data, String).ilike(f"%{search}%")
        )
    return query.offset(skip).limit(limit).all()


def get_record(db: Session, record_id: int) -> ListRecord:
    record = db.query(ListRecord).filter(ListRecord.id == record_id).first()
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return record


def update_record(db: Session, record_id: int, data: dict, user_id: int = None, user_role: str = None) -> ListRecord:
    record = db.query(ListRecord).filter(ListRecord.id == record_id).first()
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    if user_role == "admin":
        pass
    elif user_role == "direccion":
        allowed = {"estatus_cirugia"}
        if not allowed.issuperset(data.keys()):
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Dirección solo puede cambiar el estatus de cirugía")
    elif user_role == "direccion_medica":
        if "estatus_cirugia" in data:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Dirección Médica no puede cambiar el estatus de cirugía")
    elif user_role == "medico":
        if record.created_by != user_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="No puedes editar un expediente creado por otro médico")
        if "estatus_cirugia" in data:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Solo Dirección puede cambiar el estatus de cirugía")
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Acción no permitida")
    record.data = data
    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record_id: int, user_id: int = None, user_role: str = None):
    record = db.query(ListRecord).filter(ListRecord.id == record_id).first()
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    if user_role == "admin" or user_role == "direccion_medica":
        pass
    elif user_role == "medico" and record.created_by == user_id:
        pass
    else:
        from fastapi import HTTPException
        role_name = {"admin": "Administrador", "direccion": "Dirección", "direccion_medica": "Dirección Médica", "medico": "Médico"}
        raise HTTPException(status_code=403, detail=f"{role_name.get(user_role, 'Usuario')} no puede eliminar este registro")
    db.delete(record)
    db.commit()


def get_records_by_ids(db: Session, ids: list[int]) -> list[ListRecord]:
    return db.query(ListRecord).filter(ListRecord.id.in_(ids)).all()


def get_distinct_field_values(db: Session, list_id: int, field: str) -> list:
    import re
    if not re.match(r'^[a-zA-Z0-9_]+$', field):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Nombre de campo inválido")
    from sqlalchemy import text
    sql = text(f"SELECT DISTINCT data->>'{field}' AS val FROM list_records WHERE list_definition_id = :lid AND data->>'{field}' IS NOT NULL AND data->>'{field}' != '' ORDER BY val")
    result = db.execute(sql, {"lid": list_id})
    return [row[0] for row in result]
