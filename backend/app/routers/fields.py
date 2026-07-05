from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas, field_types as ft

router = APIRouter(prefix="/forms/{form_id}/fields", tags=["fields"])


def _get_form_or_404(db: Session, form_id: int) -> models.Form:
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


def _get_field_or_404(db: Session, form_id: int, field_id: int) -> models.Field:
    field = (
        db.query(models.Field)
        .filter(models.Field.id == field_id, models.Field.form_id == form_id)
        .first()
    )
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


def _assert_editable(form: models.Form):
    if form.status == models.FormStatus.archived:
        raise HTTPException(status_code=400, detail="Archived forms cannot be edited")


def _mark_unpublished_changes(form: models.Form):
    # A published form that gets its fields touched again now has changes
    # that live only in the draft state until re-published.
    if form.status == models.FormStatus.published:
        form.status = models.FormStatus.draft


def _sync_options(db: Session, field: models.Field):
    db.query(models.FieldOption).filter(models.FieldOption.field_id == field.id).delete()
    if field.field_type in ft.OPTION_TYPES:
        for i, opt in enumerate(ft.extract_options(field.config)):
            db.add(models.FieldOption(
                field_id=field.id, label=opt["label"], value=opt["value"], order=i
            ))


@router.post("", response_model=schemas.FieldOut, status_code=201)
def add_field(form_id: int, payload: schemas.FieldCreate, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    _assert_editable(form)

    try:
        cleaned_config = ft.validate_field_config(payload.field_type, payload.config)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    next_order = (max((f.order for f in form.fields), default=-1)) + 1
    field = models.Field(
        form_id=form_id, field_type=payload.field_type, label=payload.label,
        is_required=payload.is_required, config=cleaned_config, order=next_order,
    )
    db.add(field)
    db.flush()  # get field.id
    _sync_options(db, field)
    _mark_unpublished_changes(form)
    db.commit()
    db.refresh(field)
    return field


@router.patch("/{field_id}", response_model=schemas.FieldOut)
def update_field(form_id: int, field_id: int, payload: schemas.FieldUpdate,
                  db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    _assert_editable(form)
    field = _get_field_or_404(db, form_id, field_id)

    if payload.label is not None:
        field.label = payload.label
    if payload.is_required is not None:
        field.is_required = payload.is_required
    if payload.config is not None:
        try:
            field.config = ft.validate_field_config(field.field_type, payload.config)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        _sync_options(db, field)

    _mark_unpublished_changes(form)
    db.commit()
    db.refresh(field)
    return field


@router.delete("/{field_id}", status_code=204)
def delete_field(form_id: int, field_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    _assert_editable(form)
    field = _get_field_or_404(db, form_id, field_id)
    db.delete(field)
    _mark_unpublished_changes(form)
    db.commit()
    return None


@router.patch("/reorder", response_model=list[schemas.FieldOut])
def reorder_fields(form_id: int, payload: schemas.ReorderRequest, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    _assert_editable(form)

    existing_ids = {f.id for f in form.fields}
    if set(payload.field_ids) != existing_ids:
        raise HTTPException(
            status_code=400,
            detail="field_ids must contain exactly the current fields of this form",
        )

    by_id = {f.id: f for f in form.fields}
    for index, fid in enumerate(payload.field_ids):
        by_id[fid].order = index

    _mark_unpublished_changes(form)
    db.commit()
    return sorted(form.fields, key=lambda f: f.order)
