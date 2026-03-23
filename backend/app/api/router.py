"""RS Method - Base Router v1.0.0"""
from fastapi import APIRouter

from app.api.auth.router import router as auth_router


router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Auth"])
