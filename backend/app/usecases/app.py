from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.settings import settings
from app.cruds import app as crud
from app.exceptions import app as err
from app.models.app import App
from app.schemas import app as schema
from app.schemas import auth as auth_schema


def create(
    req: schema.ReqCreate, user: auth_schema.ResUserGet, db: Session
) -> schema.ResCreate:
    if user.role not in [UserRole.ADMIN, UserRole.VENDOR]:
        raise err.PermissionDenied()

    fa_icon = req.fa_icon if req.fa_icon else settings.DEFAULT_FA_ICON
    position = crud.max_position_for_tenant(db, user.tenant.id) + 1
    app = App(
        name=req.name,
        description=req.description,
        fa_icon=fa_icon,
        url=req.url,
        is_send_token_enabled=req.is_send_token_enabled,
        position=position,
        tenant_id=user.tenant.id,
        user_id=user.id,
    )
    created = crud.create(db, app)
    db.commit()
    db.refresh(created)
    return schema.ResCreate.model_validate(created)


def search(
    req: schema.ReqSearch, user: auth_schema.ResUserGet, db: Session
) -> schema.ResSearch:
    items, total = crud.get_paginated(
        db, tenant_id=user.tenant.id, page=req.page, size=req.size
    )
    res_items = [schema.ResGet.model_validate(a) for a in items]
    return schema.ResSearch.paginate(
        items=res_items, total=total, page=req.page, size=req.size
    )


def update(
    id: str,
    req: schema.ReqUpdate,
    user: auth_schema.ResUserGet,
    db: Session,
) -> schema.ResUpdate:
    if user.role not in [UserRole.ADMIN, UserRole.VENDOR]:
        raise err.PermissionDenied()

    app = crud.get_by_tenant_and_id(db, user.tenant.id, id)
    if not app:
        raise err.AppNotFound()

    if req.name is not None:
        app.name = req.name
    if req.description is not None:
        app.description = req.description
    if req.url is not None:
        app.url = req.url
    if req.is_send_token_enabled is not None:
        app.is_send_token_enabled = req.is_send_token_enabled
    if req.fa_icon is not None:
        app.fa_icon = req.fa_icon
    if req.position is not None:
        total = crud.count_for_tenant(db, user.tenant.id)
        new_pos = max(1, min(req.position, total))
        old_pos = app.position
        crud.shift_positions_on_move(
            db,
            tenant_id=user.tenant.id,
            moving_id=app.id,
            old_pos=old_pos,
            new_pos=new_pos,
        )
        app.position = new_pos

    updated = crud.update(db, app)
    db.commit()
    db.refresh(updated)
    return schema.ResUpdate.model_validate(updated)


def delete(
    id: str, user: auth_schema.ResUserGet, db: Session
) -> schema.ResDelete:
    if user.role not in [UserRole.ADMIN, UserRole.VENDOR]:
        raise err.PermissionDenied()

    if not crud.get_by_tenant_and_id(db, user.tenant.id, id):
        raise err.AppNotFound()

    crud.delete_by_tenant_and_id(db, user.tenant.id, id)
    db.commit()
    return schema.ResDelete()
