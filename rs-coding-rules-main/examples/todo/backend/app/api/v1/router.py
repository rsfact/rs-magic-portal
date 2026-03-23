from fastapi import APIRouter

from app.api.v1.tasks.router import router as tasks_router


router = APIRouter()

router.include_router(tasks_router, prefix="/tasks", tags=["v1_Tasks"])
