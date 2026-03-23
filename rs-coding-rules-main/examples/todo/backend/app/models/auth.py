""" RS Method - Auth Models v1.0.0"""
from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.core.enums import UserRole


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    idp_id = Column(
        String(255),
        nullable=True,
        unique=True,
        index=True
    )
    code = Column(String(255), nullable=False, unique=True)
    name = Column(String, nullable=False, unique=True)

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    tenant_id = Column(
        String(36),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )
    idp_id = Column(
        String(255),
        nullable=True,
        unique=True,
        index=True
    )
    name = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(UserRole, name="user_roles", native_enum=False),
        default=UserRole.USER,
        nullable=False
    )
    email = Column(String(255), unique=True, nullable=False)
    pw_hash = Column(String(255), nullable=False)

    tenant = relationship("Tenant", back_populates="users")

    # ========== custom columns below ==========

    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
