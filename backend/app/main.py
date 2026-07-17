from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import auth, users, lists, reports
from app.core.database import engine, Base, SessionLocal
from sqlalchemy import inspect, text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    db.close()
except Exception as e:
    logger.warning(f"Could not create system lists: {e}")

app = FastAPI(
    title="APP EXPEDIENTES SBJ BRIGADAS",
    description="Sistema de gestión de expedientes para SBJ Brigadas",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    try:
        response = await call_next(request)
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
