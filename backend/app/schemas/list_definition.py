from pydantic import BaseModel, field_validator
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
    id: str
    name: str
    description: Optional[str]
    columns_config: list
    is_system: bool = False
    created_by: str
    created_at: datetime

    @field_validator('id', 'created_by', mode='before')
    @classmethod
    def coerce_id(cls, v):
        return str(v)

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
