from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/forms/{token}", response_model=schemas.PublicFormOut)
def get_public_form(token: str, db: Session = Depends(get_db)):
    link = db.query(models.ShareLink).filter(models.ShareLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    version = link.form_version
    form = version.form

    fields = sorted(version.schema_snapshot, key=lambda f: f["order"])

    return schemas.PublicFormOut(
        form_title=version.title,
        form_description=version.description,
        form_status=form.status.value,
        version_number=version.version_number,
        fields=[schemas.PublicFieldOut(**f) for f in fields],
    )
