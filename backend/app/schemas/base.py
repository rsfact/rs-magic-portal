""" RS Method - Base Schemas v1.1.0"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Generic, TypeVar

from pydantic import BaseModel, Field

# ========= Base Response ==========

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    msg: str


class BaseResponse(BaseModel, Generic[T]):
    success: Optional[bool] = None
    data: Optional[T] = None
    errors: Optional[List[ErrorDetail]] = None

    @classmethod
    def create_success(cls, data: T | None = None):
        return cls(success=True, data=data, errors=[])

    @classmethod
    def create_warning(cls, data: T | None = None, errors: List[ErrorDetail] | None = None):
        return cls(
            success=True,
            data=data,
            errors=errors if errors is not None else [],
        )

    @classmethod
    def create_error(cls, errors: List[ErrorDetail]):
        return cls(
            success=False,
            data=None,
            errors=errors
        )


# ========== Pagination ==========

class ReqBasePagination(BaseModel):
    page: int = Field(default=1, ge=1, examples=[1])
    size: int = Field(default=10, ge=1, examples=[10])


class ResBasePagination(BaseModel, Generic[T]):
    total: int = Field(..., examples=[0])
    pages: int = Field(..., examples=[1])
    page: int = Field(..., examples=[1])
    size: int = Field(..., examples=[10])
    has_next: bool = Field(..., examples=[False])
    has_prev: bool = Field(..., examples=[False])
    items: List[T] = Field(..., examples=[[]])

    @classmethod
    def paginate(
        cls, items: List[T], total: int, page: int, size: int
    ):
        pages = (total + size - 1) // size if total > 0 else 1
        has_next = page < pages
        has_prev = page > 1

        return cls(
            total=total,
            pages=pages,
            page=page,
            size=size,
            has_next=has_next,
            has_prev=has_prev,
            items=items,
        )


# ========== Utility ==========

class TimezoneUtility:
    def __init__(self):
        self.jst = timezone(timedelta(hours=9))

    def ensure_utc(self, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        else:
            return dt.astimezone(timezone.utc)

    def jst_to_utc(self, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=self.jst)
        return dt.astimezone(timezone.utc)

    def utc_to_jst(self, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(self.jst)

timezone_util = TimezoneUtility()
