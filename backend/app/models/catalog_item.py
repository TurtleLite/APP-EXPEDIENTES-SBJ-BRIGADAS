from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id = Column(Integer, primary_key=True, index=True)
    item_type = Column(String(20), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    locality_type = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
