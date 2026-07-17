from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ListDefinition(Base):
    __tablename__ = "list_definitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    columns_config = Column(JSON, nullable=False)
    is_system = Column(Boolean, default=False, server_default="false")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User", backref="list_definitions")
    records = relationship("ListRecord", back_populates="list_definition", cascade="all, delete-orphan")


class ListRecord(Base):
    __tablename__ = "list_records"

    id = Column(Integer, primary_key=True, index=True)
    list_definition_id = Column(Integer, ForeignKey("list_definitions.id"), nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    list_definition = relationship("ListDefinition", back_populates="records")
