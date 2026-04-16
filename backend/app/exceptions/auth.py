""" RS Method - Auth Exception v1.2.0"""
from app.core.settings import settings
from app.exceptions import base as err


class InvalidAuthMode(err.Authorization):
    def __init__(self, msg: str):
        super().__init__(msg=f"Invalid auth mode: {msg}")


class TenantNotFound(err.NotFound):
    def __init__(self):
        super().__init__(msg="Tenant not found.")


class TenantAlreadyExists(err.Conflict):
    def __init__(self, tenant_id: str):
        super().__init__(msg=f"Tenant already exists. tenant_id={tenant_id}")


class UserNotFound(err.NotFound):
    def __init__(self):
        super().__init__(msg="User not found.")


class UserAlreadyExists(err.Conflict):
    def __init__(self):
        super().__init__(msg="Email already registered.")


class Login(err.Authentication):
    def __init__(self):
        super().__init__(msg="Invalid email or password.")


class InvalidToken(err.Authentication):
    def __init__(self):
        super().__init__(msg="Invalid token.")


class TokenExpired(err.Authentication):
    def __init__(self):
        super().__init__(msg="Token has expired.")


class TokenExpireSecondsTooLarge(err.Authentication):
    def __init__(self):
        super().__init__(msg=f"expire_seconds must be less than or equal to {settings.JWT_REFRESH_MAX_EXPIRE_SECONDS} seconds.")


class PermissionDenied(err.Authorization):
    def __init__(self):
        super().__init__(msg="Permission denied.")
