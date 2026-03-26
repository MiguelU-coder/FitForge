# ai-service/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_port: int = 8000
    app_secret: str = "dev_secret_change_in_production"

    # JWT del backend NestJS — mismo valor que JWT_ACCESS_SECRET en el backend
    # Permite verificar tokens HS256 emitidos por el backend
    jwt_access_secret: str = ""

    # Supabase
    supabase_url: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Backend (Nest) — usado para CORS y referrer
    backend_url: str = "http://localhost:3000"
    # CORS adicionales (separados por coma), ej: http://192.168.1.10:3000
    cors_origins: str = ""

    # Cache
    cache_ttl_recommendation: int = 3600
    cache_ttl_volume: int = 1800

    # AI thresholds
    min_sessions_for_analysis: int = 3
    progressive_overload_threshold: float = 0.85

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
