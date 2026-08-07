from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    username = Column(String(100), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    entity_type = Column(String(50), nullable=True, index=True)
    entity_id = Column(Integer, nullable=True)
    detail = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)