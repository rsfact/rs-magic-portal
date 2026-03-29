""" RS Method - Auth Schemas v1.2.0"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.base import timezone_util, ReqBasePagination, ResBasePagination
from app.core.enums import UserRole


# ========== Tenant ==========

class ResTenantBase(BaseModel):
    id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    code: str = Field(..., example="rsf")
    name: str = Field(..., example="RSfact")

    model_config = ConfigDict(from_attributes=True)


class ReqTenantCreate(BaseModel):
    code: str = Field(min_length=1, example="rsf")
    name: str = Field(min_length=1, example="RSfact")


class ResTenantCreate(ResTenantBase):
    pass


class ResTenantGet(ResTenantBase):
    pass


class ReqTenantSearch(ReqBasePagination):
    pass


class ResTenantSearch(ResBasePagination[ResTenantGet]):
    pass


# ========== User ==========

class ResUserBase(BaseModel):
    id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    created_at: datetime = Field(..., example="2050-12-31T23:59:59+09:00")
    name: str = Field(..., example="John Doe")
    role: UserRole = Field(..., example="user")
    email: EmailStr = Field(..., example="john.doe@example.com")
    tenant: ResTenantGet = Field(...)

    @field_validator("created_at")
    @classmethod
    def convert_utc_to_jst(cls, v: datetime) -> datetime:
        return timezone_util.utc_to_jst(v)

    model_config = ConfigDict(from_attributes=True)


class ReqUserCreate(BaseModel):
    name: str = Field(min_length=1, example="John Doe")
    role: UserRole = Field(default=UserRole.USER, example="user")
    email: EmailStr = Field(..., example="john.doe@example.com")
    password: str = Field(min_length=1, example="password123")


class ResUserCreate(ResUserBase):
    pass


class ResUserGet(ResUserBase):
    pass


class ReqUserSearch(ReqBasePagination):
    pass


class ResUserSearch(ResBasePagination[ResUserGet]):
    pass


class ReqLogin(BaseModel):
    email: EmailStr = Field(..., example="john.doe@example.com")
    password: str = Field(min_length=1, example="password123")


class ResLogin(BaseModel):
    token: str = Field(..., min_length=1, example="ey...")
    user: ResUserGet = Field(...)


class ReqRefresh(BaseModel):
    expire_hours: Optional[int] = Field(None, example=336)


class ResRefresh(BaseModel):
    token: str = Field(..., min_length=1, example="ey...")


# ========== Custom JWT for Admin ==========

class ReqJwtCreate(BaseModel):
    user_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    role: UserRole = Field(default=UserRole.USER, example="user")
    expires_at: datetime = Field(..., example="2050-12-31T23:59:59+09:00")

    @field_validator("expires_at")
    @classmethod
    def convert_jst_to_utc(cls, v: datetime) -> datetime:
        return timezone_util.jst_to_utc(v)


class ResJwtCreate(BaseModel):
    token: str = Field(..., min_length=1, example="ey...")
    user: ResUserGet = Field(...)


class ReqJwtDecode(BaseModel):
    pass


class ResJwtDecode(BaseModel):
    sub: str = Field(..., min_length=1, example="123e4567-e89b-12d3-a456-426614174000")
    exp: datetime = Field(..., example="2050-12-31T23:59:59+09:00")
    iat: datetime = Field(..., example="2050-12-31T22:59:59+09:00")
    jti: str = Field(..., min_length=1, example="550e8400-e29b-41d4-a716-446655440000")
    role: UserRole = Field(..., example="user")

    @field_validator("exp", "iat")
    @classmethod
    def convert_utc_to_jst(cls, v: datetime) -> datetime:
        return timezone_util.utc_to_jst(v)
