from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.base import ReqBasePagination, ResBasePagination


class ResBase(BaseModel):
    id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    name: str = Field(..., min_length=1, example="My App")
    description: str = Field(..., example="This is my app.")
    url: str = Field(..., example="https://myapp.com")
    is_send_token_enabled: bool = Field(..., example=False)
    fa_icon: str = Field(..., example="fa-solid fa-app")
    position: int = Field(..., example=1)

    model_config = ConfigDict(from_attributes=True)


class ResGet(ResBase):
    pass


class ReqSearch(ReqBasePagination):
    pass


class ResSearch(ResBasePagination[ResGet]):
    pass


class ReqCreate(BaseModel):
    name: str = Field(..., min_length=1, example="My App")
    description: str = Field(..., example="This is my app.")
    url: str = Field(..., min_length=1, example="https://myapp.com")
    is_send_token_enabled: bool = Field(..., example=False)
    fa_icon: Optional[str] = Field(None, example="fa-solid fa-app")


class ResCreate(ResGet):
    pass


class ReqUpdate(BaseModel):
    name: Optional[str] = Field(None, example="My App")
    description: Optional[str] = Field(None, example="This is my app.")
    url: Optional[str] = Field(None, example="https://myapp.com")
    is_send_token_enabled: Optional[bool] = Field(None, example=False)
    fa_icon: Optional[str] = Field(None, example="fa-solid fa-app")
    position: Optional[int] = Field(None, example=1)


class ResUpdate(ResGet):
    pass


class ResDelete(BaseModel):
    msg: str = Field(default="Delete successfully!")
