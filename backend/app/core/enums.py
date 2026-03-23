""" RS Method - Enums v1.0.0"""
from enum import Enum


# ========== Auth ==========

class AuthProvider(str, Enum):
    LOCAL = "local"
    POCKETBASE = "pocketbase"


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    VENDOR = "vendor"
