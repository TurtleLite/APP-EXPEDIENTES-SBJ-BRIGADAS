from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class ReportCreate(BaseModel):
    name: str
    description: Optional[str] = None
    list_definition_id: Optional[int] = None
    filters: Optional[dict] = None
    columns_selected: Optional[list[str]] = None


class ReportResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    list_definition_id: Optional[int]
    filters: Optional[dict]
    columns_selected: Optional[list]
    created_by: int
    file_path_excel: Optional[str]
    file_path_pdf: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
