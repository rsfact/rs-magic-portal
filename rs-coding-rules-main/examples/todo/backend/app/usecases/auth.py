""" RS Method - Auth Usecases v1.1.0"""
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.core.enums import AuthProvider, UserRole
from app.core import auth
from app.core.logger import logger
from app.exceptions import auth as err
from app.schemas import auth as schema
from app.models.auth import Tenant, User
from app.cruds import auth as crud


def create_tenant(req: schema.ReqTenantCreate, db: Session) -> schema.ResTenantCreate:
    tenant = crud.get_tenant_by_code(db, req.code)
    if tenant:
        raise err.TenantAlreadyExists(code=tenant.code, name=tenant.name)

    if crud.get_tenant_by_name(db, req.name):
        raise err.TenantAlreadyExists(code=tenant.code, name=tenant.name)

    tenant = Tenant(
        code=req.code,
        name=req.name,
    )
    created = crud.create_tenant(db, tenant)
    db.commit()

    return schema.ResTenantCreate.model_validate(created)


def signup(tenant_id: str, req: schema.ReqUserCreate, db: Session) -> schema.ResUserCreate:
    tenant = crud.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise err.TenantNotFound

    existing_user = crud.get_user_by_email(db, req.email)
    if existing_user:
        raise err.UserAlreadyExists

    user = User(
        tenant_id=tenant.id,
        name=req.name,
        role=req.role,
        email=req.email,
        pw_hash=auth.hash_password(req.password)
    )
    created = crud.create_user(db, user)
    db.commit()

    return schema.ResUserCreate.model_validate(created)


def search_users(req: schema.ReqUserSearch, user: User, db: Session) -> schema.ResUserSearch:
    if user.role != UserRole.ADMIN:
        raise err.PermissionDenied()

    limit = req.size
    offset = (req.page - 1) * req.size
    total, items = crud.get_users_by_tenant_id(
        db=db, tenant_id=user.tenant.id, limit=limit, offset=offset
    )

    res_items = [schema.ResUserGet.model_validate(u) for u in items]
    return schema.ResUserSearch.paginate(
        items=res_items, total=total, page=req.page, size=req.size
    )


def login(req: schema.ReqLogin, db: Session) -> schema.ResLogin:
    user = crud.get_user_by_email(db, req.email)

    # 1. Try login
    if settings.AUTH_MODE == AuthProvider.LOCAL:
        if not user:
            raise err.Login
        if not auth.verify_password(req.password, user.pw_hash):
            raise err.Login

    elif settings.AUTH_MODE == AuthProvider.POCKETBASE:
        pb_token, pb_user, pb_tenant = auth.pb_login(req.email, req.password)

        existing_tenant = crud.get_tenant_by_code(db, pb_tenant.code)

        # 2. Sync tenant
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
                idp_id=pb_tenant.id
            )
            tenant_for_user = crud.create_tenant(db, tenant)

        # 3. Sync user
        existing_user = crud.get_user_by_email(db, pb_user.email)

        # 3-1. Update user
        if existing_user:
            user = existing_user
            user.idp_id = pb_user.id
            user.name = pb_user.name
            user.role = pb_user.role
            user.pw_hash="POCKETBASE"

        # 3-2. Create user
        else:
            user = User(
                tenant_id=tenant_for_user.id,
                name=pb_user.name,
                email=pb_user.email,
                role=pb_user.role,
                idp_id=pb_user.id,
                pw_hash="POCKETBASE",
            )
            user = crud.create_user(db, user)

    else:
        logger.critical(f"Invalid auth provider mode: {settings.AUTH_MODE}")
        raise Exception("Invalid auth provider mode")

    token = auth.create_jwt(user.id, user.role.value)
    db.commit()

    return schema.ResLogin(
        token=token,
        user=schema.ResUserGet.model_validate(user),
    )


def refresh(jwt: schema.ResJwtDecode) -> schema.ResRefresh:
    token = auth.create_jwt(jwt.sub, jwt.role.value)

    return schema.ResRefresh(token=token)


def get_my_profile(user: schema.ResUserGet) -> schema.ResUserGet:
    return schema.ResUserGet.model_validate(user)


def encode_jwt(req: schema.ReqJwtCreate, db: Session) -> schema.ResJwtCreate:
    user = crud.get_user_by_id(db, req.user_id)
    if not user:
        raise err.UserNotFound

    token = auth.create_jwt(
        sub=req.user_id,
        role=req.role.value if req.role else "",
        expires_at=req.expires_at,
    )
    logger.info(f"Token generated for user {req.user_id}")

    return schema.ResJwtCreate(
        token=token,
        user=schema.ResUserGet.model_validate(user),
    )


def decode_jwt(jwt: schema.ResJwtDecode) -> schema.ResJwtDecode:
    return jwt


def _get_user(jwt: schema.ResJwtDecode, db: Session) -> schema.ResUserGet:
    user = crud.get_user_by_id(db, jwt.sub)
    if not user:
        raise err.UserNotFound

    return schema.ResUserGet.model_validate(user)
