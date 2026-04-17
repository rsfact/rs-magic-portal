"""RS Method - Auth Schemas v1.5.0"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.enums import UserRole
from app.core.settings import settings
from app.schemas.base import timezone_util, ReqBasePagination, ResBasePagination


# ========== Tenant ==========

class ResTenantBase(BaseModel):
    id: str = Field(examples=["123e4567-e89b-12d3-a456-426614174000"])
    code: str = Field(examples=["rsf"])
    name: str = Field(examples=["RSfact"])

    model_config = ConfigDict(from_attributes=True)


class ReqTenantCreate(BaseModel):
    code: str = Field(min_length=1, examples=["rsf"])
    name: str = Field(min_length=1, examples=["RSfact"])


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
    id: str = Field(examples=["123e4567-e89b-12d3-a456-426614174000"])
    created_at: datetime = Field(examples=["2050-12-31T23:59:59+09:00"])
    tenant_id: str = Field(examples=["123e4567-e89b-12d3-a456-426614174000"])
    name: str = Field(examples=["John Doe"])
    role: UserRole = Field(examples=["user"])
    email: EmailStr = Field(examples=["john.doe@example.com"])

    @field_validator("created_at")
    @classmethod
    def convert_utc_to_jst(cls, v: datetime) -> datetime:
        return timezone_util.utc_to_jst(v)

    model_config = ConfigDict(from_attributes=True)


class ReqUserCreate(BaseModel):
    name: str = Field(min_length=1, examples=["John Doe"])
    role: UserRole = Field(default=UserRole.USER, examples=["user"])
    email: EmailStr = Field(examples=["john.doe@example.com"])
    password: str = Field(min_length=1, examples=["password123"])


class ResUserCreate(ResUserBase):
    pass


class ResUserGet(ResUserBase):
    pass


class ReqUserSearch(ReqBasePagination):
    pass


class ResUserSearch(ResBasePagination[ResUserGet]):
    pass


# ========== Auth ==========

class ReqLogin(BaseModel):
    email: EmailStr = Field(examples=["john.doe@example.com"])
    password: str = Field(min_length=1, examples=["password123"])


class ResLogin(BaseModel):
    token: str = Field(min_length=1, examples=["ey..."])
    user: ResUserGet


class ReqRefresh(BaseModel):
    expire_seconds: Optional[int] = Field(
        default=None,
        ge=1,
        le=settings.JWT_REFRESH_MAX_EXPIRE_SECONDS,
        description="Custom expiry seconds",
        examples=[settings.JWT_REFRESH_MAX_EXPIRE_SECONDS],
    )


class ReqImpersonate(BaseModel):
    user_id: str = Field(examples=["123e4567-e89b-12d3-a456-426614174000"])
    expire_minutes: int = Field(ge=1, le=60, description="有効期限（分）、最大60分", examples=[30])


class ResImpersonate(ResLogin):
    pass


class ResRefresh(ResLogin):
    pass


class ReqHandoff(BaseModel):
    pass


class ResHandoff(ResLogin):
    pass


# ========== Custom JWT for Admin ==========

class ReqJwtCreate(BaseModel):
    user_id: str = Field(examples=["123e4567-e89b-12d3-a456-426614174000"])
    expires_at: datetime = Field(examples=["2050-12-31T23:59:59+09:00"])

    @field_validator("expires_at")
    @classmethod
    def convert_jst_to_utc(cls, v: datetime) -> datetime:
        return timezone_util.jst_to_utc(v)


class ResJwtCreate(BaseModel):
    token: str = Field(min_length=1, examples=["ey..."])
    user: ResUserGet


class ReqJwtDecode(BaseModel):
    pass


class ResJwtDecode(BaseModel):
    sub: str = Field(min_length=1, examples=["123e4567-e89b-12d3-a456-426614174000"])
    exp: datetime = Field(examples=["2050-12-31T23:59:59+09:00"])
    iat: datetime = Field(examples=["2050-12-31T22:59:59+09:00"])
    jti: str = Field(min_length=1, examples=["550e8400-e29b-41d4-a716-446655440000"])
    email: EmailStr = Field(examples=["john.doe@example.com"])
    role: UserRole = Field(examples=["user"])
    tenant_id: str = Field(examples=["123e4567-e89b-12d3-a456-426614174000"])

    @field_validator("exp", "iat")
    @classmethod
    def convert_utc_to_jst(cls, v: datetime) -> datetime:
        return timezone_util.utc_to_jst(v)
