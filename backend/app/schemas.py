from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field as PydanticField


# ---------- Field Types (Day 2) ----------

class FieldTypeOut(BaseModel):
    type: str
    label: str
    icon: str
    properties: List[Dict[str, Any]]


# ---------- Fields (Day 2-4) ----------

class FieldOptionOut(BaseModel):
    label: str
    value: str

    class Config:
        from_attributes = True


class FieldCreate(BaseModel):
    field_type: str
    label: str
    is_required: bool = False
    config: Dict[str, Any] = {}


class FieldUpdate(BaseModel):
    label: Optional[str] = None
    is_required: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class FieldOut(BaseModel):
    id: int
    field_type: str
    label: str
    is_required: bool
    config: Dict[str, Any]
    order: int
    options: List[FieldOptionOut] = []

    class Config:
        from_attributes = True


class ReorderRequest(BaseModel):
    field_ids: List[int] = PydanticField(..., description="Field IDs in desired order")


# ---------- Forms (Day 1, 3, 5) ----------

class FormCreate(BaseModel):
    title: str
    description: str = ""


class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class FormSummaryOut(BaseModel):
    id: int
    title: str
    description: str
    status: str
    field_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FormDetailOut(BaseModel):
    id: int
    title: str
    description: str
    status: str
    is_editable: bool
    created_at: datetime
    updated_at: datetime
    fields: List[FieldOut] = []

    class Config:
        from_attributes = True


# ---------- Versions (Day 5) ----------

class FormVersionOut(BaseModel):
    id: int
    version_number: int
    title: str
    status: str
    published_at: datetime

    class Config:
        from_attributes = True


# ---------- Share Links (Day 6) ----------

class ShareLinkOut(BaseModel):
    token: str
    path: str
    form_version_id: int


class PublicFieldOut(BaseModel):
    id: int
    field_type: str
    label: str
    is_required: bool
    config: Dict[str, Any]
    order: int


class PublicFormOut(BaseModel):
    form_title: str
    form_description: str
    form_status: str
    version_number: int
    fields: List[PublicFieldOut]
