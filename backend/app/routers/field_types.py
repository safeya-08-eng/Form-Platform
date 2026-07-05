from fastapi import APIRouter

from .. import field_types as ft
from ..schemas import FieldTypeOut

router = APIRouter(tags=["field-types"])


@router.get("/field-types", response_model=list[FieldTypeOut])
def get_field_types():
    """Returns the supported field types + their configurable properties.
    Drives the frontend Field Type Palette and per-field config forms.
    """
    return ft.list_field_types()
