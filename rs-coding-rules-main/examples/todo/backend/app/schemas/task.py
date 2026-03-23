from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import ReqBasePagination, ResBasePagination, timezone_util


class ResBase(BaseModel):
    id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    created_at: datetime = Field(..., example="2025-01-01T09:00:00+09:00")
    content: str = Field(..., example="This is my first task.")

    @field_validator("created_at")
    @classmethod
    def convert_utc_to_jst(cls, v: datetime) -> datetime:
        if v is not None:
            return timezone_util.utc_to_jst(v)
        return v

    model_config = {"from_attributes": True}


class ReqCreate(BaseModel):
    content: str = Field(..., min_length=1, example="This is my first task.")


class ResCreate(ResBase):
    pass


class ResGet(ResBase):
    pass


class ReqUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, example="This is my first task.")


class ResUpdate(ResBase):
    pass


class ResDelete(BaseModel):
    msg: str = Field(default="Delete successfully!")


class ReqSearch(ReqBasePagination):
    pass


class SearchItem(ResBase):
    pass


class ResSearch(ResBasePagination[SearchItem]):
    pass
