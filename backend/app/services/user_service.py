from sqlalchemy.orm import Session
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
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Usuario o email ya existe")
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, data) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    for key, value in update_data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()


def ensure_default_users(db: Session):
    for username, email, full_name, password, role in [
        ("admin", "admin@sistema.com", "Administrador", "admin123", "admin"),
        ("direccion", "direccion@sistema.com", "Director General", "direccion123", "direccion"),
        ("medico", "medico@sistema.com", "Dr. Médico", "medico123", "medico"),
    ]:
        existing = db.query(User).filter(User.username == username).first()
        if not existing:
            db.add(User(
                username=username, email=email, full_name=full_name,
                hashed_password=hash_password(password), role=role, is_active=True,
            ))
    db.commit()


def reset_default_users(db: Session):
    db.query(User).delete()
    db.flush()
    ensure_default_users(db)
