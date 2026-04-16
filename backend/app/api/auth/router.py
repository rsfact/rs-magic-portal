""" RS Method - Auth Router v1.3.0 """
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.core.auth import get_user, require_local_auth, verify_jwt, verify_master_key
from app.core.db import get_db
from app.models.auth import User
from app.schemas import auth as schema
from app.schemas.base import BaseResponse
from app.usecases import auth as usecase


router = APIRouter()


# ========== Auth ==========

@router.post("/login", response_model=BaseResponse[schema.ResLogin])
def login(
    req: schema.ReqLogin,
    db: Session = Depends(get_db),
):
    """
    - 認証方式により動作が異なります。
    - `local` の場合: email と password で認証します。
    - `pocketbase` の場合: PocketBase を用いて認証し、ローカルの認証関連テーブルに UPSERT します。
    """
    result = usecase.login(req, db)
    return BaseResponse.create_success(result)


@router.post(
    "/refresh",
    response_model=BaseResponse[schema.ResRefresh],
    description=(
        f"- JWTを検証し、有効期限内であれば新しいJWTを返します。\n"
        f"- 新しい有効期限は秒単位で指定可能で、1〜{settings.JWT_REFRESH_MAX_EXPIRE_SECONDS}秒({settings.JWT_REFRESH_MAX_EXPIRE_SECONDS // 60 // 60 // 24}日)の範囲で指定可能です。\n"
        "- 認証関連テーブルの更新は行いません。"
    ),
)
def refresh(
    req: schema.ReqRefresh,
    jwt: schema.ResJwtDecode = Depends(verify_jwt()),
    db: Session = Depends(get_db),
):
    result = usecase.refresh(req, jwt, db)
    return BaseResponse.create_success(result)


@router.post("/handoff", response_model=BaseResponse[schema.ResHandoff])
def handoff(
    jwt: schema.ResJwtDecode = Depends(verify_jwt()),
    db: Session = Depends(get_db),
):
    """
    - 他システムから受け取った短命JWTを検証し、このシステム用の認証情報へ交換します。
    - `email` クレームをキーに、このシステムのユーザーへ引き当てます。
    - なお、転送用JWTの想定有効期限は 30 秒です。
    """
    result = usecase.handoff(jwt, db)
    return BaseResponse.create_success(result)


@router.get("/me", response_model=BaseResponse[schema.ResUserGet])
def get_my_profile(
    user: schema.ResUserGet = Depends(get_user),
):
    """
    - 現在の認証ユーザー情報を返します。
    """
    return BaseResponse.create_success(user)


# ========== User / Tenant Management ==========

@router.post(
    "/users/search",
    response_model=BaseResponse[schema.ResUserSearch],
)
def search_users(
    req: schema.ReqUserSearch,
    user: User = Depends(get_user),
    db: Session = Depends(get_db),
):
    """
    - `role=admin` 以上のみ検索できます。
    """
    result = usecase.search_users(req, user, db)
    return BaseResponse.create_success(result)


@router.post("/tenants", response_model=BaseResponse[schema.ResTenantCreate])
def create_tenant(
    req: schema.ReqTenantCreate,
    _1=Depends(require_local_auth),
    _2=Depends(verify_master_key),
    db: Session = Depends(get_db),
):
    """
    - 認証方式が `local` である場合のみ有効です。
    - `MASTER_KEY` で認証してください。
    """
    result = usecase.create_tenant(req, db)
    return BaseResponse.create_success(result)


@router.post(
    "/tenants/search",
    response_model=BaseResponse[schema.ResTenantSearch],
)
def search_tenants(
    req: schema.ReqTenantSearch,
    user: User = Depends(get_user),
    db: Session = Depends(get_db),
):
    """
    - `role=vendor` のみ検索できます。
    """
    result = usecase.search_tenants(req, user, db)
    return BaseResponse.create_success(result)


@router.post(
    "/tenants/{tenant_id}/users",
    response_model=BaseResponse[schema.ResUserCreate],
)
def create_tenant_user(
    tenant_id: str,
    req: schema.ReqUserCreate,
    _1=Depends(require_local_auth),
    _2=Depends(verify_master_key),
    db: Session = Depends(get_db),
):
    """
    - 認証方式が `local` である場合のみ有効です。
    - `MASTER_KEY` で認証してください。
    """
    result = usecase.signup(tenant_id, req, db)
    return BaseResponse.create_success(result)


# ========== JWT Utilities ==========

@router.post("/jwt/encode", response_model=BaseResponse[schema.ResJwtCreate])
def encode_jwt(
    req: schema.ReqJwtCreate,
    _1=Depends(verify_master_key),
    db: Session = Depends(get_db),
):
    """
    - `MASTER_KEY` で認証してください。
    - 有効期限は秒単位で指定可能です。
    """
    result = usecase.encode_jwt(req, db)
    return BaseResponse.create_success(result)


@router.post("/jwt/decode", response_model=BaseResponse[schema.ResJwtDecode])
def decode_jwt(
    jwt: schema.ResJwtDecode = Depends(verify_jwt()),
):
    """
    - デコード対象のJWTで認証してください。
    """
    result = usecase.decode_jwt(jwt)
    return BaseResponse.create_success(result)
