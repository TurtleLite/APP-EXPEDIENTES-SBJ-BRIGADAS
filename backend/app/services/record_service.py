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
    if user_role == "medico" and record.created_by != user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No puedes editar un expediente creado por otro médico")
    record.data = data
    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record_id: int):
    record = db.query(ListRecord).filter(ListRecord.id == record_id).first()
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    db.delete(record)
    db.commit()


def get_records_by_ids(db: Session, ids: list[int]) -> list[ListRecord]:
    return db.query(ListRecord).filter(ListRecord.id.in_(ids)).all()


def get_distinct_field_values(db: Session, list_id: int, field: str) -> list:
    from sqlalchemy import text
    sql = text(f"SELECT DISTINCT data->>'{field}' AS val FROM list_records WHERE list_definition_id = :lid AND data->>'{field}' IS NOT NULL AND data->>'{field}' != '' ORDER BY val")
    result = db.execute(sql, {"lid": list_id})
    return [row[0] for row in result]
