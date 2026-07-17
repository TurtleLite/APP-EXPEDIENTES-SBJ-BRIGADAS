from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://gestion_user:gestion_pass@localhost:5432/gestion_db"
    SECRET_KEY: str = "tu_clave_secreta_super_segura_cambiar_en_produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    UPLOAD_DIR: str = "uploads"
    REPORTS_DIR: str = "reports"
    EXPORTS_DIR: str = "exports"

    class Config:
        env_file = ".env"


settings = Settings()
