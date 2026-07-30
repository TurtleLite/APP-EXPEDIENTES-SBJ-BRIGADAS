from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from app.api import auth, users, lists, reports
from app.core.database import engine, Base, SessionLocal
from sqlalchemy import inspect, text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import fnmatch

ALLOWED_ORIGINS = [
    "https://app-expedientes-sbj-brigadas.onrender.com",
    "https://expedientes-api-2dje.onrender.com",
    "https://*.trycloudflare.com",
    "https://api.trycloudflare.com",
    "http://localhost:5173",
    "http://localhost:8000",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tablas creadas")
    except Exception as e:
        logger.warning(f"Error creando tablas: {e}")

    try:
        inspector = inspect(engine)
        if "list_definitions" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("list_definitions")]
            if "is_system" not in columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE list_definitions ADD COLUMN is_system BOOLEAN DEFAULT FALSE"))
                    conn.commit()
                logger.info("Added is_system column to list_definitions")
        if "list_records" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("list_records")]
            if "created_by" not in columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE list_records ADD COLUMN created_by INTEGER REFERENCES users(id)"))
                    conn.commit()
                logger.info("Added created_by column to list_records")
    except Exception as e:
        logger.warning(f"Could not add column: {e}")

    try:
        db = SessionLocal()
        from app.services.list_service import ensure_system_lists
        ensure_system_lists(db)
        from app.services.user_service import reset_default_users
        reset_default_users(db)
        db.close()
        logger.info("Usuarios por defecto reseteados")
    except Exception as e:
        logger.warning(f"Startup error: {e}")

    yield

app = FastAPI(
    title="APP EXPEDIENTES SBJ BRIGADAS",
    description="Sistema de gestión de expedientes para SBJ Brigadas",
    version="1.0.0",
    lifespan=lifespan,
)

def _origin_allowed(origin: str) -> bool:
    for allowed in ALLOWED_ORIGINS:
        if fnmatch.fnmatch(origin, allowed):
            return True
    return False

def _cors_headers(origin: str) -> dict:
    if not _origin_allowed(origin):
        return {}
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
    }


@app.middleware("http")
async def cors_and_logging(request: Request, call_next):
    origin = request.headers.get("origin", "")
    method = request.method

    if method == "OPTIONS":
        headers = _cors_headers(origin)
        if headers:
            headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With"
            headers["Access-Control-Max-Age"] = "86400"
            logger.info(f"OPTIONS {request.url.path} -> CORS preflight OK ({origin})")
        else:
            logger.info(f"OPTIONS {request.url.path} -> origin blocked ({origin})")
        return Response(headers=headers)

    logger.info(f"{method} {request.url.path}")
    try:
        response = await call_next(request)
        headers = _cors_headers(origin)
        for k, v in headers.items():
            response.headers[k] = v
        return response
    except Exception as e:
        logger.error(f"  -> ERROR: {e}", exc_info=True)
        headers = _cors_headers(origin)
        return JSONResponse({"detail": str(e)}, status_code=500, headers=headers)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(lists.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "Sistema de Gestión API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
