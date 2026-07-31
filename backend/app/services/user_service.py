from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.user import User
from app.core.security import hash_password
from app.schemas.user import UserCreate, UserUpdate


def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()


def get_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def create_user(db: Session, data: UserCreate) -> User:
    existing = db.query(User).filter(
        (User.username == data.username) | (User.telefono == data.telefono)
    ).first()
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Usuario o teléfono ya existe")
    user = User(
        username=data.username,
        telefono=data.telefono,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Usuario o teléfono ya existe")
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, data) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            update_data["hashed_password"] = hash_password(password)
    for key, value in update_data.items():
        setattr(user, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="El usuario o teléfono ya está en uso por otro usuario")
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()


def reset_default_users(db: Session):
    defaults = [
        User(username="admin", telefono="2201-1100", full_name="Administrador",
             hashed_password=hash_password("admin123"), role="admin", is_active=True),
        User(username="direccion", telefono="2201-1101", full_name="Director General",
             hashed_password=hash_password("direccion123"), role="direccion", is_active=True),
        User(username="direccionmedica", telefono="2201-1102", full_name="Dirección Médica",
             hashed_password=hash_password("direccionmedica123"), role="direccion_medica", is_active=True),
        User(username="medico", telefono="2201-1103", full_name="Dr. Médico",
             hashed_password=hash_password("medico123"), role="medico", is_active=True),
    ]
    for u in defaults:
        existing = db.query(User).filter(User.username == u.username).first()
        if not existing:
            db.add(u)
    db.commit()
