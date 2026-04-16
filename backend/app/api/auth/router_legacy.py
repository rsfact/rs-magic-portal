"""
RS Method - Auth Router (Legacy Aliases)

TODO: このファイルは Chrome 拡張機能が新しいエンドポイント (/api/auth/login など) に
更新されるまでの暫定措置です。拡張機能の配布更新が完了したら削除してください。
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth.router import login, refresh, get_my_profile
from app.core.auth import get_user, verify_jwt
from app.core.db import get_db
from app.schemas import auth as schema
from app.schemas.base import BaseResponse


router = APIRouter()


@router.post(
    "/users/login",
    response_model=BaseResponse[schema.ResLogin],
    include_in_schema=False,
    deprecated=True,
)
def login_legacy(
    req: schema.ReqLogin,
    db: Session = Depends(get_db),
):
    return login(req, db)


@router.post(
    "/users/refresh",
    response_model=BaseResponse[schema.ResRefresh],
    include_in_schema=False,
    deprecated=True,
)
def refresh_legacy(
    req: schema.ReqRefresh,
    jwt: schema.ResJwtDecode = Depends(verify_jwt()),
    db: Session = Depends(get_db),
):
    return refresh(req, jwt, db)


@router.get(
    "/users/me",
    response_model=BaseResponse[schema.ResUserGet],
    include_in_schema=False,
    deprecated=True,
)
def get_my_profile_legacy(
    user: schema.ResUserGet = Depends(get_user),
):
    return get_my_profile(user)
