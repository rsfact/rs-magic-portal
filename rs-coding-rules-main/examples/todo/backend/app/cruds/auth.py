"""RS Method - Auth CRUD v1.2.0"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.auth import Tenant, User


def create_tenant(db: Session, tenant: Tenant) -> Tenant:
    db.add(tenant)
    db.flush()
    db.refresh(tenant)
    return tenant


def get_tenant_by_id(db: Session, id: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.id == id).first()


def get_tenant_by_code(db: Session, code: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.code == code).first()


def get_tenant_by_name(db: Session, name: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.name == name).first()


def get_tenant_by_idp_id(db: Session, idp_id: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.idp_id == idp_id).first()


def create_user(db: Session, user: User) -> User:
    db.add(user)
    db.flush()
    db.refresh(user)
    return user


def get_users_by_tenant_id(
    db: Session, tenant_id: str, limit: int, offset: int
) -> tuple[int, list[User]]:
    query = db.query(User).filter(User.tenant_id == tenant_id)
    total = query.count()
    items = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return total, items


def get_user_by_id(db: Session, id: str) -> Optional[User]:
    return db.query(User).filter(User.id == id).first()


def get_user_by_idp_id(db: Session, idp_id: str) -> Optional[User]:
    return db.query(User).filter(User.idp_id == idp_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()
