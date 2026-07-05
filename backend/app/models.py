import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, ForeignKey, DateTime, JSON, Enum
)
from sqlalchemy.orm import relationship

from .database import Base


class FormStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class VersionStatus(str, enum.Enum):
    published = "published"
    archived = "archived"


def _uuid():
    return uuid.uuid4().hex


class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    status = Column(Enum(FormStatus), default=FormStatus.draft, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fields = relationship(
        "Field", back_populates="form", cascade="all, delete-orphan",
        order_by="Field.order"
    )
    versions = relationship(
        "FormVersion", back_populates="form", cascade="all, delete-orphan",
        order_by="FormVersion.version_number.desc()"
    )


class Field(Base):
    """Represents the current, editable draft state of a form's fields."""
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    field_type = Column(String(50), nullable=False)
    label = Column(String(255), nullable=False)
    is_required = Column(Boolean, default=False)
    config = Column(JSON, default=dict)  # field-type-specific config (JSONB in Postgres)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    form = relationship("Form", back_populates="fields")
    options = relationship(
        "FieldOption", back_populates="field", cascade="all, delete-orphan",
        order_by="FieldOption.order"
    )


class FieldOption(Base):
    """Normalized options for dropdown / multi_checkbox fields."""
    __tablename__ = "field_options"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    label = Column(String(255), nullable=False)
    value = Column(String(255), nullable=False)
    order = Column(Integer, default=0)

    field = relationship("Field", back_populates="options")


class FormVersion(Base):
    """Immutable snapshot of a form's schema at publish time."""
    __tablename__ = "form_versions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    schema_snapshot = Column(JSON, nullable=False)  # frozen list of field dicts
    status = Column(Enum(VersionStatus), default=VersionStatus.published, nullable=False)
    published_at = Column(DateTime, default=datetime.utcnow)

    form = relationship("Form", back_populates="versions")
    links = relationship("ShareLink", back_populates="form_version", cascade="all, delete-orphan")


class ShareLink(Base):
    __tablename__ = "share_links"

    id = Column(Integer, primary_key=True, index=True)
    form_version_id = Column(Integer, ForeignKey("form_versions.id"), nullable=False)
    token = Column(String(64), unique=True, default=_uuid, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    form_version = relationship("FormVersion", back_populates="links")
