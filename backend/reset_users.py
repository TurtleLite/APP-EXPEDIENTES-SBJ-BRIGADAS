from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)


def reset_users():
    db = SessionLocal()
    try:
        db.query(User).delete()
        db.commit()

        admin = User(
            username="admin",
            email="admin@sistema.com",
            full_name="Administrador",
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True,
        )
        db.add(admin)

        direccion = User(
            username="direccion",
            email="direccion@sistema.com",
            full_name="Director General",
            hashed_password=hash_password("direccion123"),
            role="direccion",
            is_active=True,
        )
        db.add(direccion)

        medico = User(
            username="medico",
            email="medico@sistema.com",
            full_name="Dr. Médico",
            hashed_password=hash_password("medico123"),
            role="medico",
            is_active=True,
        )
        db.add(medico)

        db.commit()
        print("Usuarios reseteados correctamente:")
        print("  admin / admin123")
        print("  direccion / direccion123")
        print("  medico / medico123")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    reset_users()
