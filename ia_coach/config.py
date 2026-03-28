# ia_coach/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_port: int = 8001

    # JWT — reutiliza los mismos secrets que ia_microservices y el backend
    jwt_access_secret: str = ""
    app_secret: str = "dev_secret_change_in_production"
    supabase_url: str = ""
    ai_service_secret: str = ""

    # Redis (compartido con ia_microservices)
    redis_url: str = "redis://localhost:6379"

    # ── Google Gemini API (Gratuita) ───────────────────────────────────────────
    # Obtén tu API key gratis en: https://aistudio.google.com/app/apikey
    # Límite: 1.5M tokens/mes gratis con Gemini 1.5 Flash
    gemini_api_key: str = ""

    # ExerciseDB via RapidAPI
    exercise_db_api_key: str = ""
    exercise_db_host: str = "exercisedb.p.rapidapi.com"

    # Cache TTL
    cache_ttl_coach: int = 60         # Coach feedback: 60s (muy dinámico)
    cache_ttl_routine: int = 86400    # Rutinas: 24h (no cambian seguido)

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
