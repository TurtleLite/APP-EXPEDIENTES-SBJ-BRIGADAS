from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class ColumnConfig(BaseModel):
    key: str
    label: str
    type: str = "text"


class ListDefinitionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    columns_config: list[ColumnConfig]


class ListDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    columns_config: Optional[list[ColumnConfig]] = None


class ListDefinitionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    columns_config: list
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class ListRecordCreate(BaseModel):
    data: dict


class ListRecordResponse(BaseModel):
    id: int
    list_definition_id: int
    data: dict
    created_at: datetime

    class Config:
        from_attributes = True
