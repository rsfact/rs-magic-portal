from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_user, verify_jwt
from app.core.db import get_db
from app.schemas import auth
from app.schemas import task as schema
from app.schemas.base import BaseResponse
from app.usecases import task as usecase


router = APIRouter()


@router.post("/", response_model=BaseResponse[schema.ResCreate])
def create(
    req: schema.ReqCreate,
    _: auth.ResJwtDecode = Depends(verify_jwt()),
    user: auth.ResUserGet = Depends(get_user),
    db: Session = Depends(get_db)
):
    result = usecase.create(req=req, user=user, db=db)
    return BaseResponse.create_success(result)


@router.get("/{id}", response_model=BaseResponse[schema.ResGet])
def get(
    id: str,
    _: auth.ResJwtDecode = Depends(verify_jwt()),
    user: auth.ResUserGet = Depends(get_user),
    db: Session = Depends(get_db),
):
    result = usecase.get(id=id, user=user, db=db)
    return BaseResponse.create_success(result)


@router.post("/search", response_model=BaseResponse[schema.ResSearch])
def search(
    req: schema.ReqSearch,
    _: auth.ResJwtDecode = Depends(verify_jwt()),
    user: auth.ResUserGet = Depends(get_user),
    db: Session = Depends(get_db),
):
    result = usecase.search(req=req, user=user, db=db)
    return BaseResponse.create_success(result)


@router.patch("/{id}", response_model=BaseResponse[schema.ResUpdate])
def patch(
    id: str,
    req: schema.ReqUpdate,
    _: auth.ResJwtDecode = Depends(verify_jwt()),
    user: auth.ResUserGet = Depends(get_user),
    db: Session = Depends(get_db),
):
    result = usecase.update(id=id, req=req, user=user, db=db)
    return BaseResponse.create_success(result)


@router.delete("/{id}", response_model=BaseResponse[schema.ResDelete])
def delete(
    id: str,
    _: auth.ResJwtDecode = Depends(verify_jwt()),
    user: auth.ResUserGet = Depends(get_user),
    db: Session = Depends(get_db),
):
    result = usecase.delete(id=id, user=user, db=db)
    return BaseResponse.create_success(result)
