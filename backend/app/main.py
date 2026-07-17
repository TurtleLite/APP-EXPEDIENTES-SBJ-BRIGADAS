from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from app.api import auth, users, lists, reports
from app.core.database import engine, Base, SessionLocal
from sqlalchemy import inspect, text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_ORIGINS = [
    "https://app-expedientes-sbj-brigadas.onrender.com",
    "http://localhost:5173",
    "http://localhost:8000",
]

Base.metadata.create_all(bind=engine)

# Add is_system column if it doesn't exist (for existing DBs)
try:
    inspector = inspect(engine)
    if "list_definitions" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("list_definitions")]
        if "is_system" not in columns:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE list_definitions ADD COLUMN is_system BOOLEAN DEFAULT FALSE"))
                conn.commit()
            logger.info("Added is_system column to list_definitions")
except Exception as e:
    logger.warning(f"Could not add is_system column: {e}")

# Create system lists on startup
try:
    db = SessionLocal()
    from app.services.list_service import ensure_system_lists
    ensure_system_lists(db)
    from app.services.user_service import ensure_default_users
    ensure_default_users(db)
    db.close()
    logger.info("Usuarios por defecto asegurados")
except Exception as e:
    logger.warning(f"Startup error: {e}")

app = FastAPI(
    title="APP EXPEDIENTES SBJ BRIGADAS",
    description="Sistema de gestión de expedientes para SBJ Brigadas",
    version="1.0.0",
)

@app.middleware("http")
async def cors_and_logging(request: Request, call_next):
    origin = request.headers.get("origin", "")
    method = request.method

    if origin in ALLOWED_ORIGINS:
        if method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "86400"
            logger.info(f"OPTIONS {request.url.path} -> CORS preflight OK")
            return response

    logger.info(f"{method} {request.url.path}")
    try:
        response = await call_next(request)
        if origin in ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        logger.info(f"  -> {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"  -> ERROR: {e}", exc_info=True)
        return JSONResponse({"detail": str(e)}, status_code=500)

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
