"""RS Method - Auth Usecases v1.3.0"""
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.settings import settings
from app.core.enums import AuthProvider, UserRole
from app.core import auth
from app.core.logger import logger
from app.exceptions import auth as err
from app.schemas import auth as schema
from app.models.auth import Tenant, User
from app.cruds import auth as crud


# ========== Auth ==========

def login(req: schema.ReqLogin, db: Session) -> schema.ResLogin:
    # 1. Authenticate
    if settings.AUTH_MODE == AuthProvider.LOCAL.value:
        user = crud.get_user_by_email(db, req.email)
        if not user:
            raise err.Login()
        if not auth.verify_password(req.password, user.pw_hash):
            raise err.Login()

    elif settings.AUTH_MODE == AuthProvider.POCKETBASE.value:
        _, pb_user, pb_tenant = auth.pb_login(req.email, req.password)

        # 2. Sync tenant
        existing_tenant = crud.get_tenant_by_code(db, pb_tenant.code)

        # 2-1. Update tenant
        if existing_tenant:
            existing_tenant.code = pb_tenant.code
            existing_tenant.name = pb_tenant.name
            existing_tenant.idp_id = pb_tenant.id
            tenant_for_user = existing_tenant
        # 2-2. Create tenant
        else:
            tenant = Tenant(
                code=pb_tenant.code,
                name=pb_tenant.name,
                idp_id=pb_tenant.id,
            )
            tenant_for_user = crud.create_tenant(db, tenant)

        # 3. Sync user
        existing_user = crud.get_user_by_email(db, pb_user.email)

        # 3-1. Update user
        if existing_user:
            user = existing_user
            user.tenant_id = tenant_for_user.id
            user.idp_id = pb_user.id
            user.name = pb_user.name
            user.email = pb_user.email
            user.role = pb_user.role
            user.pw_hash = "POCKETBASE"
        # 3-2. Create user
        else:
            user = crud.create_user(db, User(
                tenant_id=tenant_for_user.id,
                name=pb_user.name,
                email=pb_user.email,
                role=pb_user.role,
                idp_id=pb_user.id,
                pw_hash="POCKETBASE",
            ))

    else:
        raise RuntimeError(f"Invalid auth provider mode: {settings.AUTH_MODE}")

    # 4. Issue JWT
    token = auth.create_jwt(
        sub=user.id,
        email=user.email,
        role=user.role.value,
        tenant_id=user.tenant_id,
    )
    db.commit()

    return schema.ResLogin(
        token=token,
        user=schema.ResUserGet.model_validate(user),
    )


def refresh(req: schema.ReqRefresh, jwt: schema.ResJwtDecode, db: Session) -> schema.ResRefresh:
    if req.expire_seconds is None:
        expire_seconds = settings.JWT_DEFAULT_EXPIRE_SECONDS
    else:
        if req.expire_seconds > settings.JWT_REFRESH_MAX_EXPIRE_SECONDS:
            raise err.TokenExpireSecondsTooLarge()
        expire_seconds = req.expire_seconds

    user = crud.get_user_by_id(db, jwt.sub)
    if not user:
        raise err.UserNotFound()

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expire_seconds)

    token = auth.create_jwt(
        sub=user.id,
        email=user.email,
        role=user.role.value,
        tenant_id=user.tenant_id,
        expires_at=expires_at,
    )

    return schema.ResRefresh(
        token=token,
        user=schema.ResUserGet.model_validate(user)
    )


def handoff(jwt: schema.ResJwtDecode, db: Session) -> schema.ResHandoff:
    user = crud.get_user_by_email(db, jwt.email)
    if not user:
        raise err.Login()

    token = auth.create_jwt(
        sub=user.id,
        email=user.email,
        role=user.role.value,
        tenant_id=user.tenant_id,
    )

    return schema.ResHandoff(
        token=token,
        user=schema.ResUserGet.model_validate(user)
    )


def get_my_profile(user: schema.ResUserGet) -> schema.ResUserGet:
    return schema.ResUserGet.model_validate(user)


# ========== User / Tenant Management ==========

def get_user(jwt: schema.ResJwtDecode, db: Session) -> schema.ResUserGet:
    user = crud.get_user_by_id(db, jwt.sub)
    if not user:
        raise err.UserNotFound()

    return schema.ResUserGet.model_validate(user)


def search_users(req: schema.ReqUserSearch, user: User, db: Session) -> schema.ResUserSearch:
    # Only admins and vendors can list users
    if user.role not in [UserRole.ADMIN, UserRole.VENDOR]:
        raise err.PermissionDenied()

    limit = req.size
    offset = (req.page - 1) * req.size
    total, items = crud.get_paginated_users_by_tenant_id(
        db=db, tenant_id=user.tenant_id, limit=limit, offset=offset
    )

    res_items = [schema.ResUserGet.model_validate(u) for u in items]
    return schema.ResUserSearch.paginate(
        items=res_items, total=total, page=req.page, size=req.size
    )


def create_tenant(req: schema.ReqTenantCreate, db: Session) -> schema.ResTenantCreate:
    # Check duplicate code
    existing = crud.get_tenant_by_code(db, req.code)
    if existing:
        raise err.TenantAlreadyExists(tenant_id=existing.id)

    # Check duplicate name
    existing_by_name = crud.get_tenant_by_name(db, req.name)
    if existing_by_name:
        raise err.TenantAlreadyExists(tenant_id=existing_by_name.id)

    # Create tenant
    tenant = Tenant(
        code=req.code,
        name=req.name,
    )
    created = crud.create_tenant(db, tenant)
    db.commit()

    return schema.ResTenantCreate.model_validate(created)


def search_tenants(req: schema.ReqTenantSearch, user: User, db: Session) -> schema.ResTenantSearch:
    # Only vendors can list tenants
    if user.role != UserRole.VENDOR:
        raise err.PermissionDenied()

    limit = req.size
    offset = (req.page - 1) * req.size
    total, items = crud.get_paginated_tenants(
        db=db, limit=limit, offset=offset
    )

    res_items = [schema.ResTenantGet.model_validate(t) for t in items]
    return schema.ResTenantSearch.paginate(
        items=res_items, total=total, page=req.page, size=req.size
    )


def signup(tenant_id: str, req: schema.ReqUserCreate, db: Session) -> schema.ResUserCreate:
    # Verify tenant exists
    tenant = crud.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise err.TenantNotFound()

    # Check duplicate email
    existing_user = crud.get_user_by_email(db, req.email)
    if existing_user:
        raise err.UserAlreadyExists()

    # Create user
    user = User(
        tenant_id=tenant.id,
        name=req.name,
        role=req.role,
        email=req.email,
        pw_hash=auth.hash_password(req.password),
    )
    created = crud.create_user(db, user)
    db.commit()

    return schema.ResUserCreate.model_validate(created)


# ========== JWT Utilities ==========

def encode_jwt(req: schema.ReqJwtCreate, db: Session) -> schema.ResJwtCreate:
    # Verify user exists
    user = crud.get_user_by_id(db, req.user_id)
    if not user:
        raise err.UserNotFound()

    # Issue token
    token = auth.create_jwt(
        sub=req.user_id,
        email=user.email,
        role=user.role.value,
        tenant_id=user.tenant_id,
        expires_at=req.expires_at,
    )
    logger.info(f"Token generated for user {req.user_id}")

    return schema.ResJwtCreate(
        token=token,
        user=schema.ResUserGet.model_validate(user),
    )


def decode_jwt(jwt: schema.ResJwtDecode) -> schema.ResJwtDecode:
    return jwt
