""" RS Method - Auth Router v1.1.0"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_user, require_local_auth, verify_jwt, verify_master_key
from app.core.db import get_db
from app.schemas import auth as schema
from app.schemas.base import BaseResponse
from app.models.auth import User
from app.usecases import auth as usecase


router = APIRouter()


@router.post("/tenants", response_model=BaseResponse[schema.ResTenantCreate])
def create_tenant(
    req: schema.ReqTenantCreate,
    _1= Depends(require_local_auth),
    _2= Depends(verify_master_key),
    db: Session = Depends(get_db)
):
    """
    - 認証方式が `local` である場合のみ有効です。
    - `MASTER_KEY` で認証してください。
    """
    result = usecase.create_tenant(req, db)
    return BaseResponse.create_success(result)


@router.post("/tenants/{tenant_id}/users/signup", response_model=BaseResponse[schema.ResUserCreate])
def signup(
    tenant_id: str,
    req: schema.ReqUserCreate,
    _1= Depends(require_local_auth),
    _2= Depends(verify_master_key),
    db: Session = Depends(get_db)
):
    """
    - 認証方式が `local` である場合のみ有効です。
    - `MASTER_KEY` で認証してください。
    """
    result = usecase.signup(tenant_id, req, db)
    return BaseResponse.create_success(result)


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
    - `role=admin` のみ検索できます。
    """
    result = usecase.search_users(req, user, db)
    return BaseResponse.create_success(result)


@router.post("/users/login", response_model=BaseResponse[schema.ResLogin])
def login(
    req: schema.ReqLogin,
    db: Session = Depends(get_db)
):
    """
    - 認証方式により動作が異なります。
    - `local` の場合: email と password で認証します。
    - `pocketbase` の場合: PocketBase を用いて認証し、ローカルの認証関連テーブルに UPSERT します。
    """
    result = usecase.login(req, db)
    return BaseResponse.create_success(result)


@router.post("/users/refresh", response_model=BaseResponse[schema.ResRefresh])
def refresh(
    _: schema.ReqRefresh,
    jwt: schema.ResJwtDecode = Depends(verify_jwt())
):
    """
    - 認証方式に関わらず、JWTを検証し、有効期限内であれば新しいJWTを返します。
    - 認証関連テーブルの更新は行いません。
    """
    result = usecase.refresh(jwt)
    return BaseResponse.create_success(result)


@router.get("/users/me", response_model=BaseResponse[schema.ResUserGet])
def get_my_profile(
    user: schema.ResUserGet = Depends(get_user),
):
    return BaseResponse.create_success(user)


@router.post("/users/jwt/enc", response_model=BaseResponse[schema.ResJwtCreate])
def encode_jwt(
    req: schema.ReqJwtCreate,
    _1= Depends(verify_master_key),
    db: Session = Depends(get_db)
):
    """
    - `MASTER_KEY` で認証してください。
    - 通常、 `role=user` です。
    - JST日時で有効期限を指定します。サーバー内部でUTCに変換されます。
    """
    result = usecase.encode_jwt(req, db)
    return BaseResponse.create_success(result)


@router.post("/users/jwt/dec", response_model=BaseResponse[schema.ResJwtDecode])
def decode_jwt(
    jwt: schema.ResJwtDecode = Depends(verify_jwt())
):
    """
    - デコード対象のJWTで認証してください。
    """
    result = usecase.decode_jwt(jwt)
    return BaseResponse.create_success(result)
