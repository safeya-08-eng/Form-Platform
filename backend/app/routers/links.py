from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/forms/{form_id}", tags=["links"])


@router.post("/generate-link", response_model=schemas.ShareLinkOut, status_code=201)
def generate_link(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    latest_version = (
        db.query(models.FormVersion)
        .filter(models.FormVersion.form_id == form_id)
        .order_by(models.FormVersion.version_number.desc())
        .first()
    )
    if not latest_version:
        raise HTTPException(status_code=400, detail="Publish the form before generating a link")

    existing = (
        db.query(models.ShareLink)
        .filter(models.ShareLink.form_version_id == latest_version.id)
        .first()
    )
    if existing:
        link = existing
    else:
        link = models.ShareLink(form_version_id=latest_version.id)
        db.add(link)
        db.commit()
        db.refresh(link)

    return schemas.ShareLinkOut(
        token=link.token, path=f"/f/{link.token}", form_version_id=latest_version.id
    )
