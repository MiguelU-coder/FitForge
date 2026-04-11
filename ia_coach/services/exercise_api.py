# ia_coach/services/exercise_api.py
"""
Cliente para ejercicios del backend (Prisma).
Usa los ejercicios importados desde ExerciseDB a la BD del backend.
"""
from __future__ import annotations
import structlog
import httpx
from typing import Optional
from config import get_settings

settings = get_settings()
logger   = structlog.get_logger()

BACKEND_URL = settings.backend_url


def _get_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.jwt_access_secret}",
        "Content-Type": "application/json",
    }


MUSCLE_MAPPING = {
    "CHEST": "chest",
    "BACK": "back",
    "SHOULDERS": "shoulders",
    "BICEPS": "upper arms",
    "TRICEPS": "upper arms",
    "QUADS": "upper legs",
    "HAMSTRINGS": "upper legs",
    "GLUTES": "upper legs",
    "CALVES": "lower legs",
    "ABS": "waist",
    "LATS": "back",
    "TRAPS": "back",
}


async def get_exercises_by_muscle(muscle: str, limit: int = 10) -> list[dict]:
    """
    Busca ejercicios por grupo muscular desde el backend.
    muscle: 'CHEST' | 'BACK' | 'SHOULDERS' | etc.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            muscle_param = MUSCLE_MAPPING.get(muscle.upper(), muscle.lower())
            resp = await client.get(
                f"{BACKEND_URL}/exercises",
                headers=_get_headers(),
                params={"muscle": muscle_param, "limit": limit},
            )
            resp.raise_for_status()
            data = resp.json()
            exercises = data.get("data", []) if isinstance(data, dict) else data
            return [
                {
                    "name": ex.get("name", ""),
                    "primary_muscles": ex.get("primaryMuscles", []),
                    "secondary_muscles": ex.get("secondaryMuscles", []),
                    "equipment": ex.get("equipment", ""),
                    "exercise_type": ex.get("exerciseType", ""),
                }
                for ex in exercises
            ]
    except Exception as e:
        logger.warning("exercise_api.error", muscle=muscle, error=str(e))
        return []


async def get_exercises_by_equipment(equipment: str, limit: int = 15) -> list[dict]:
    """
    Busca ejercicios según el equipo disponible desde el backend.
    equipment: 'BARBELL' | 'DUMBBELL' | 'CABLE' | 'BODYWEIGHT' etc.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BACKEND_URL}/exercises",
                headers=_get_headers(),
                params={"equipment": equipment.upper(), "limit": limit},
            )
            resp.raise_for_status()
            data = resp.json()
            exercises = data.get("data", []) if isinstance(data, dict) else data
            return [
                {
                    "name": ex.get("name", ""),
                    "primary_muscles": ex.get("primaryMuscles", []),
                    "equipment": ex.get("equipment", ""),
                    "exercise_type": ex.get("exerciseType", ""),
                }
                for ex in exercises
            ]
    except Exception as e:
        logger.warning("exercise_api.error", equipment=equipment, error=str(e))
        return []


async def get_body_parts() -> list[str]:
    """Lista todos los body parts disponibles."""
    return ["chest", "back", "shoulders", "upper arms", "upper legs", "lower legs", "waist", "cardio"]