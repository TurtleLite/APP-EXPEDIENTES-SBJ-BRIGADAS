from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    list_definition_id = Column(Integer, ForeignKey("list_definitions.id"), nullable=True)
    filters = Column(JSON, nullable=True)
    columns_selected = Column(JSON, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path_excel = Column(String(500), nullable=True)
    file_path_pdf = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", backref="reports")
    list_definition = relationship("ListDefinition")
