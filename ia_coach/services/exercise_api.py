# ia_coach/services/exercise_api.py
"""
Cliente para ExerciseDB (RapidAPI).
Obtiene datos de ejercicios para enriquecer el context del coach
y para generar rutinas basadas en evidencia.
"""
from __future__ import annotations
import structlog
import httpx
from typing import Optional
from config import get_settings

settings = get_settings()
logger   = structlog.get_logger()

BASE_URL = "https://exercisedb.p.rapidapi.com"
HEADERS  = {
    "x-rapidapi-key":  settings.exercise_db_api_key,
    "x-rapidapi-host": settings.exercise_db_host,
}


async def get_exercises_by_muscle(muscle: str, limit: int = 10) -> list[dict]:
    """
    Busca ejercicios por grupo muscular.
    Usado por el generador de rutinas para proponer ejercicios concretos.
    muscle: 'chest' | 'back' | 'shoulders' | 'upper arms' | 'upper legs' | etc.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BASE_URL}/exercises/bodyPart/{muscle}",
                headers=HEADERS,
                params={"limit": limit, "offset": 0},
            )
            resp.raise_for_status()
            exercises = resp.json()
            # Normalizar para el LLM
            return [
                {
                    "name": ex.get("name", ""),
                    "body_part": ex.get("bodyPart", ""),
                    "target": ex.get("target", ""),
                    "equipment": ex.get("equipment", ""),
                    "secondary_muscles": ex.get("secondaryMuscles", []),
                }
                for ex in exercises
            ]
    except Exception as e:
        logger.warning("exercise_api.error", muscle=muscle, error=str(e))
        return []


async def get_exercises_by_equipment(equipment: str, limit: int = 15) -> list[dict]:
    """
    Busca ejercicios según el equipo disponible.
    equipment: 'barbell' | 'dumbbell' | 'cable' | 'body weight' | etc.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BASE_URL}/exercises/equipment/{equipment}",
                headers=HEADERS,
                params={"limit": limit, "offset": 0},
            )
            resp.raise_for_status()
            exercises = resp.json()
            return [
                {
                    "name": ex.get("name", ""),
                    "body_part": ex.get("bodyPart", ""),
                    "target": ex.get("target", ""),
                    "equipment": ex.get("equipment", ""),
                }
                for ex in exercises
            ]
    except Exception as e:
        logger.warning("exercise_api.error", equipment=equipment, error=str(e))
        return []


async def get_body_parts() -> list[str]:
    """Lista todos los body parts disponibles."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{BASE_URL}/exercises/bodyPartList", headers=HEADERS)
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return ["chest", "back", "shoulders", "upper arms", "upper legs", "lower legs", "waist", "cardio"]
