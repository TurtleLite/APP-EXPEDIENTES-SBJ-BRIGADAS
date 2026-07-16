from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import auth, users, lists, reports
from app.core.database import engine, Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

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
