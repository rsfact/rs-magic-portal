""" RS Method - Exception Handers v1.0.0"""
import traceback

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.logger import logger
from app.exceptions import base as err
from app.schemas.base import BaseResponse, ErrorDetail


def base(req: Request, exc: err.Base):
    """For custom exceptions"""
    logger.warning(f"App error handled: {req.method} {req.url} - {exc.status_code} [{exc.error_code}] {exc.msg}")
    err = ErrorDetail(code=exc.error_code, msg=exc.msg)
    res = BaseResponse.create_error([err])
    return JSONResponse(
        status_code=exc.status_code,
        content=res.model_dump()
    )


def http(req: Request, exc: HTTPException):
    """For HTTP exceptions raised by FastAPI automatically or your code manually"""
    logger.warning(f"HTTP error handled: {req.method} {req.url} - {exc.status_code}: {exc.detail}")
    err = ErrorDetail(code="HTTP", msg=str(exc.detail))
    res = BaseResponse.create_error([err])
    return JSONResponse(
        status_code=exc.status_code,
        content=res.model_dump()
    )


def validation(req: Request, exc: RequestValidationError):
    """Only for 422 Unprocessable Entity Error from Pydantic validation"""
    logger.warning(f"Validation error handled: {req.method} {req.url} - {exc.errors()}")
    errors = []
    for err in exc.errors():
        msg = f"{' -> '.join(str(loc) for loc in err['loc'])}: {err['msg']}"
        errors.append(ErrorDetail(code="VALIDATION", msg=msg))
    res = BaseResponse.create_error(errors)
    return JSONResponse(
        status_code=422,
        content=res.model_dump()
    )


def general(req: Request, exc: Exception):
    """For uncaught python exceptions."""
    logger.error(f"Uncaught error handled: {req.method} {req.url}")
    logger.error(f"Exception: {type(exc).__name__}: {exc}")
    logger.error(f"Traceback:\n{traceback.format_exc()}")
    err = ErrorDetail(code="INTERNAL", msg="An unexpected error occurred.")
    res = BaseResponse.create_error([err])
    return JSONResponse(
        status_code=500,
        content=res.model_dump()
    )


def setup(app):
    app.add_exception_handler(err.Base, base)
    app.add_exception_handler(HTTPException, http)
    app.add_exception_handler(RequestValidationError, validation)
    app.add_exception_handler(Exception, general)
