"""Application configuration loaded from environment variables.

All secrets (database URL, JWT secret, admin credentials) are read from the
environment so that nothing sensitive is ever committed to source control.
"""
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _split_origins(v) -> list[str]:
    if isinstance(v, str):
        return [origin.strip() for origin in v.split(",") if origin.strip()]
    if isinstance(v, (list, tuple)):
        return [str(origin).strip() for origin in v if str(origin).strip()]
    return []


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Driving School Management API"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # CORS — kept as plain string so the env file can be a simple comma-separated list.
    BACKEND_CORS_ORIGINS_STR: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Database
    DATABASE_URL: str = "sqlite:///./driving_school.db"

    # JWT / Auth
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Admin credentials — used by /auth/login. NEVER expose these to the frontend.
    ADMIN_EMAIL: str = "admin@drivingschool.com"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_NAME: str = "Administrator"

    # File uploads
    UPLOAD_DIR: str = "uploads"
    PHOTO_DIR: str = "uploads/photos"
    MAX_PHOTO_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB

    @property
    def BACKEND_CORS_ORIGINS(self) -> list[str]:
        return _split_origins(self.BACKEND_CORS_ORIGINS_STR)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
