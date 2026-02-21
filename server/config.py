"""
SmartAgri AI - Server Configuration
Reads environment variables using Pydantic Settings.
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    LOG_LEVEL: str = "info"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./smartagri.db"

    # JWT
    SECRET_KEY: str = "smartagri-dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # ML
    MODEL_DIR: str = "./ml_models"

    # External APIs
    OPENWEATHER_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    MANDI_API_BASE: str = "https://api.data.gov.in/resource"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # File Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 5

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
