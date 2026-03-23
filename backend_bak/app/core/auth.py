from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

import bcrypt
import jwt
import requests
from cryptography.fernet import Fernet
from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.enums import AuthProvider, UserRole
from app.core.logger import logger
from app.core.settings import settings
from app.exceptions import auth as err
from app.schemas import auth as schema
from app.usecases import auth as usecase




security = HTTPBearer()


# ========== DI ==========

def verify_master_key(creds: HTTPAuthorizationCredentials = Security(security)) -> None:
    if creds.credentials != settings.JWT_MASTER_KEY:
        logger.warning("Invalid master token")
        raise err.InvalidToken


def verify_jwt(role: Optional[str] = None):
    def _verify(
        creds: HTTPAuthorizationCredentials = Security(security),
    ) -> schema.ResJwtDecode:
        try:
            token = creds.credentials
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])

            user_role = payload.get("role", "") or ""
            if role and user_role != role:
                raise err.PermissionDenied(msg=f"`{role}` is required.")

            return schema.ResJwtDecode(
                sub=payload["sub"],
                iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
                exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
                jti=payload["jti"],
                role=user_role,
            )
        except jwt.ExpiredSignatureError as e:
            logger.warning(f"Token has expired: {str(e)}")
            raise err.TokenExpired
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            raise err.InvalidToken

    return _verify


def require_local_auth():
    if settings.AUTH_MODE != AuthProvider.LOCAL.value:
        raise err.InvalidAuthMode(msg="This endpoint requires local auth mode")


def get_user(
    jwt: schema.ResJwtDecode = Security(verify_jwt()),
    db: Session = Depends(get_db),
) -> schema.ResUserGet:
    return usecase._get_user(jwt, db)


# ========== JWT ==========

def create_jwt(
    sub: str,
    role: str,
    expires_at: Optional[datetime] = None,
) -> str:
    now = datetime.now(timezone.utc)
    exp = expires_at if expires_at else now + timedelta(hours=settings.JWT_DEFAULT_EXPIRE_HOURS)
    claims = {
        "sub": sub,
        "exp": exp,
        "iat": now,
        "jti": str(uuid.uuid4()),
        "role": role,
    }
    return jwt.encode(claims, settings.JWT_SECRET, algorithm="HS256")


# ========== Password Hashing ==========

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


# ========== Crypt ==========

def encrypt_key(plaintext: str) -> str:
    return Fernet(settings.ENCRYPTION_KEY.encode()).encrypt(plaintext.encode()).decode()


def decrypt_key(ciphertext: str) -> str:
    return Fernet(settings.ENCRYPTION_KEY.encode()).decrypt(ciphertext.encode()).decode()


# ========== PocketBase ==========

class Tenant(BaseModel):
    id: str
    code: str
    name: str


class User(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    code: str
    employment_type: str


class OutPbLogin(BaseModel):
    token: str
    tenant: Tenant
    user: User


def pb_login(email: str, pw: str) -> tuple[str, User, Tenant]:
    try:
        if not settings.PB_BASE_URL:
            raise Exception("PocketBase URL is not configured")

        url = f"{settings.PB_BASE_URL}/api/collections/users/auth-with-password"
        params = {"expand": "tenant_id"}

        res = requests.post(url, params=params, json={"identity": email, "password": pw})
        res.raise_for_status()
        data = res.json()

        record = data["record"]
        tenant_data = record["expand"]["tenant_id"]

        token = data["token"]
        tenant = Tenant(
            id=tenant_data["id"],
            code=tenant_data["code"],
            name=tenant_data["name"],
        )
        user = User(
            id=record["id"],
            email=record["email"],
            name=record["name"],
            role=UserRole(record["role"]),
            code=record.get("code") or "",
            employment_type=record.get("employment_type") or "",
        )

        return token, user, tenant
    except requests.exceptions.HTTPError as e:
        raise err.Login
    except Exception as e:
        logger.error(f"PocketBase login failed: {str(e)}")
        raise
