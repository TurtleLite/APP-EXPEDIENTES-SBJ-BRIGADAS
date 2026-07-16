from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.list_definition import ListDefinition, ListRecord
from app.schemas.list_definition import ListDefinitionCreate, ListDefinitionUpdate, ListRecordCreate
from typing import Optional


def create_list_definition(db: Session, data: ListDefinitionCreate, user_id: int) -> ListDefinition:
    ld = ListDefinition(
        name=data.name,
        description=data.description,
        columns_config=[c.model_dump() for c in data.columns_config],
        created_by=user_id,
    )
    db.add(ld)
    db.commit()
    db.refresh(ld)
    return ld


def get_list_definitions(db: Session, skip: int = 0, limit: int = 100) -> list[ListDefinition]:
    return db.query(ListDefinition).offset(skip).limit(limit).all()


def get_list_definition(db: Session, list_id: int) -> ListDefinition:
    ld = db.query(ListDefinition).filter(ListDefinition.id == list_id).first()
    if not ld:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    return ld


def update_list_definition(db: Session, list_id: int, data) -> ListDefinition:
    ld = db.query(ListDefinition).filter(ListDefinition.id == list_id).first()
    if not ld:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    update_data = data.model_dump(exclude_unset=True)
    if "columns_config" in update_data:
        update_data["columns_config"] = [c.model_dump() for c in data.columns_config]
    for key, value in update_data.items():
        setattr(ld, key, value)
    db.commit()
    db.refresh(ld)
    return ld


def delete_list_definition(db: Session, list_id: int):
    ld = db.query(ListDefinition).filter(ListDefinition.id == list_id).first()
    if not ld:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    db.delete(ld)
    db.commit()
