from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.app import App


def create(db: Session, app: App) -> App:
    db.add(app)
    db.flush()
    db.refresh(app)
    return app


def get_by_tenant_and_id(db: Session, tenant_id: str, id: str) -> Optional[App]:
    return (
        db.query(App)
        .filter(App.tenant_id == tenant_id, App.id == id)
        .first()
    )


def get_paginated(
    db: Session, tenant_id: str, page: int, size: int
) -> tuple[list[App], int]:
    skip = (page - 1) * size
    query = db.query(App).filter(App.tenant_id == tenant_id)
    total = query.count()
    items = query.order_by(App.position.asc()).offset(skip).limit(size).all()
    return items, total


def max_position_for_tenant(db: Session, tenant_id: str) -> int:
    value = (
        db.query(func.max(App.position))
        .filter(App.tenant_id == tenant_id)
        .scalar()
    )
    return int(value) if value is not None else 0


def count_for_tenant(db: Session, tenant_id: str) -> int:
    return db.query(App).filter(App.tenant_id == tenant_id).count()


def shift_positions_on_move(
    db: Session,
    tenant_id: str,
    moving_id: str,
    old_pos: int,
    new_pos: int,
) -> None:
    if new_pos == old_pos:
        return
    if new_pos < old_pos:
        db.query(App).filter(
            App.tenant_id == tenant_id,
            App.id != moving_id,
            App.position >= new_pos,
            App.position < old_pos,
        ).update(
            {App.position: App.position + 1},
            synchronize_session=False,
        )
    else:
        db.query(App).filter(
            App.tenant_id == tenant_id,
            App.id != moving_id,
            App.position > old_pos,
            App.position <= new_pos,
        ).update(
            {App.position: App.position - 1},
            synchronize_session=False,
        )


def update(db: Session, app: App) -> App:
    db.add(app)
    db.flush()
    db.refresh(app)
    return app


def delete_by_tenant_and_id(db: Session, tenant_id: str, id: str) -> None:
    app = get_by_tenant_and_id(db, tenant_id, id)
    if app:
        db.delete(app)
