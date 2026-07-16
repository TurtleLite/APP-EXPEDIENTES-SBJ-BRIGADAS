from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from app.models.list_definition import ListRecord, ListDefinition
from typing import Optional


def add_record(db: Session, list_id: int, data: dict) -> ListRecord:
    record = ListRecord(list_definition_id=list_id, data=data)
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


def update_record(db: Session, record_id: int, data: dict) -> ListRecord:
    record = db.query(ListRecord).filter(ListRecord.id == record_id).first()
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Registro no encontrado")
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
