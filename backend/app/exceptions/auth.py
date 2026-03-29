""" RS Method - Auth Exception v1.1.0"""
from app.exceptions import base as err


class InvalidAuthMode(err.Authorization):
    def __init__(self, msg: str):
        super().__init__(msg=f"Invalid auth mode: {msg}")


class TenantNotFound(err.NotFound):
    def __init__(self):
        super().__init__(msg="Tenant not found.")


class TenantAlreadyExists(err.Conflict):
    def __init__(self, code: str = None, name: str = None):
        super().__init__(
            msg=f"Tenant already exists: code={code}, name={name}"
        )


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


class TokenInvalidExpireHours(err.Authentication):
    def __init__(self):
        super().__init__(msg="expire_hours has exceeded the maximum value.")


class PermissionDenied(err.Authorization):
    def __init__(self):
        super().__init__(msg="Permission denied.")
