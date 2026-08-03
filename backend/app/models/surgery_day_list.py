from sqlalchemy import Column, Integer, Date, JSON, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class SurgeryDayList(Base):
    __tablename__ = "surgery_day_lists"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    record_ids = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())