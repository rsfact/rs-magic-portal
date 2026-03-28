from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_user, verify_jwt
from app.core.db import get_db
from app.schemas import app as schema
from app.schemas import auth as auth_schema
from app.schemas.base import BaseResponse
from app.usecases import app as usecase


router = APIRouter()


@router.post("/search", response_model=BaseResponse[schema.ResSearch])
def search(
    req: schema.ReqSearch,
    _: auth_schema.ResJwtDecode = Depends(verify_jwt()),
    user: auth_schema.ResUserGet = Depends(get_user),
    db: Session = Depends(get_db)
):
    result = usecase.search(req=req, user=user, db=db)
    return BaseResponse.create_success(result)


@router.post("/create", response_model=BaseResponse[schema.ResCreate])
def create(
    req: schema.ReqCreate,
    _: auth_schema.ResJwtDecode = Depends(verify_jwt()),
    user: auth_schema.ResUserGet = Depends(get_user),
    db: Session = Depends(get_db)
):
    """
    - `role=admin`
    """
    result = usecase.create(req=req, user=user, db=db)
    return BaseResponse.create_success(result)


@router.patch("/{id}", response_model=BaseResponse[schema.ResUpdate])
def update(
    id: str,
    req: schema.ReqUpdate,
    _: auth_schema.ResJwtDecode = Depends(verify_jwt()),
    user: auth_schema.ResUserGet = Depends(get_user),
    db: Session = Depends(get_db),
):
    """
    - `role=admin`
    """
    result = usecase.update(id=id, req=req, user=user, db=db)
    return BaseResponse.create_success(result)


@router.delete("/{id}", response_model=BaseResponse[schema.ResDelete])
def delete(
    id: str,
    _: auth_schema.ResJwtDecode = Depends(verify_jwt()),
    user: auth_schema.ResUserGet = Depends(get_user),
    db: Session = Depends(get_db)
):
    """
    - `role=admin`
    """
    result = usecase.delete(id=id, user=user, db=db)
    return BaseResponse.create_success(result)
