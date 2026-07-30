from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

if "cockroachlabs" in settings.DATABASE_URL:
    from sqlalchemy.dialects import registry
    registry.register("cockroachdb", "app.core.cockroach_dialect", "CockroachDialect")
    url = settings.DATABASE_URL.replace("postgresql://", "cockroachdb://", 1)
    engine = create_engine(url, pool_pre_ping=True)
else:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
