from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/forms", tags=["forms"])


def _get_form_or_404(db: Session, form_id: int) -> models.Form:
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


def _is_editable(form: models.Form) -> bool:
    return form.status != models.FormStatus.archived


# ---------- Day 1/3: create + fetch ----------

@router.post("", response_model=schemas.FormDetailOut, status_code=201)
def create_form(payload: schemas.FormCreate, db: Session = Depends(get_db)):
    form = models.Form(title=payload.title, description=payload.description)
    db.add(form)
    db.commit()
    db.refresh(form)
    return _to_detail(form)


@router.get("", response_model=list[schemas.FormSummaryOut])
def list_forms(db: Session = Depends(get_db)):
    forms = db.query(models.Form).order_by(models.Form.updated_at.desc()).all()
    out = []
    for f in forms:
        out.append(schemas.FormSummaryOut(
            id=f.id, title=f.title, description=f.description,
            status=f.status.value, field_count=len(f.fields),
            created_at=f.created_at, updated_at=f.updated_at,
        ))
    return out


@router.get("/{form_id}", response_model=schemas.FormDetailOut)
def get_form(form_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    return _to_detail(form)


@router.patch("/{form_id}", response_model=schemas.FormDetailOut)
def update_form(form_id: int, payload: schemas.FormUpdate, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    if not _is_editable(form):
        raise HTTPException(status_code=400, detail="Archived forms cannot be edited")
    if payload.title is not None:
        form.title = payload.title
    if payload.description is not None:
        form.description = payload.description
    db.commit()
    db.refresh(form)
    return _to_detail(form)


def _to_detail(form: models.Form) -> schemas.FormDetailOut:
    return schemas.FormDetailOut(
        id=form.id, title=form.title, description=form.description,
        status=form.status.value, is_editable=_is_editable(form),
        created_at=form.created_at, updated_at=form.updated_at,
        fields=[schemas.FieldOut.model_validate(f) for f in form.fields],
    )


# ---------- Day 5: publish / archive / versions ----------

@router.post("/{form_id}/publish", response_model=schemas.FormVersionOut, status_code=201)
def publish_form(form_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    if form.status == models.FormStatus.archived:
        raise HTTPException(status_code=400, detail="Archived forms cannot be published")
    if not form.fields:
        raise HTTPException(status_code=400, detail="Add at least one field before publishing")

    next_version = (
        db.query(func.max(models.FormVersion.version_number))
        .filter(models.FormVersion.form_id == form.id)
        .scalar() or 0
    ) + 1

    snapshot = [
        {
            "id": f.id,
            "field_type": f.field_type,
            "label": f.label,
            "is_required": f.is_required,
            "config": f.config,
            "order": f.order,
        }
        for f in form.fields
    ]

    version = models.FormVersion(
        form_id=form.id,
        version_number=next_version,
        title=form.title,
        description=form.description,
        schema_snapshot=snapshot,
        status=models.VersionStatus.published,
    )
    db.add(version)
    form.status = models.FormStatus.published
    db.commit()
    db.refresh(version)
    return version


@router.post("/{form_id}/archive", response_model=schemas.FormDetailOut)
def archive_form(form_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    form.status = models.FormStatus.archived
    for v in form.versions:
        v.status = models.VersionStatus.archived
    db.commit()
    db.refresh(form)
    return _to_detail(form)


@router.get("/{form_id}/versions", response_model=list[schemas.FormVersionOut])
def list_versions(form_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    return sorted(form.versions, key=lambda v: v.version_number, reverse=True)
