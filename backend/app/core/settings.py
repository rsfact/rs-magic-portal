""" RS Method - Settings v1.3.0"""
from typing import Optional
import os

from pydantic import computed_field, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.enums import AuthProvider


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Environment
    APP_VERSION: str = "0.1.0"
    APP_NAME: str = "Magic Portal"
    APP_DESCRIPTION: str = ""
    APP_PORT: int
    APP_BASE_URL: str
    APP_BASE_PATH: str
    APP_DEBUG: bool = Field(default=False)

    # Auth
    AUTH_MODE: AuthProvider
    PB_BASE_URL: Optional[str] = Field(None)
    JWT_SECRET: str
    JWT_MASTER_KEY: str
    JWT_DEFAULT_EXPIRE_SECONDS: int = 24 * 14 * 60 * 60
    JWT_REFRESH_MAX_EXPIRE_SECONDS: int = 24 * 14 * 60 * 60
    JWT_HANDOFF_EXPIRE_SECONDS: int = 30

    # Encryption
    ENCRYPTION_KEY: str

    # Logging
    LOG_DIR: str = "logs"
    LOG_FILENAME: str = "app.log"

    @computed_field
    @property
    def LOG_FILE(self) -> str:
        return os.path.join(self.LOG_DIR, self.LOG_FILENAME)

    # ========== custom settings below ==========

    DEFAULT_FA_ICON: str = "fa-solid fa-wand-magic-sparkles"

    # Database
    DB_URL: str

settings = Settings()
