from fastapi import APIRouter

from app.api.v1.app.router import router as app_router


router = APIRouter()

router.include_router(app_router, prefix="/apps", tags=["v1_Apps"])
