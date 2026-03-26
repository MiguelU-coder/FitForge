# ia_coach/routers/coach_router.py
"""
Router principal del AI Coach.
Endpoints:
  POST /coach/analyze  → Feedback en tiempo real por cada set
  POST /coach/session  → Resumen al finalizar la rutina
  POST /coach/routine  → Generar rutina IA en el onboarding
"""
from __future__ import annotations
import json
import re
import structlog
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import verify_jwt_token
from middleware.cache import cache_get, cache_set, _make_cache_key
from services.llm_client import ask_coach, COACH_SYSTEM
from services.prompt_builder import (
    build_set_feedback_prompt,
    build_session_summary_prompt,
    build_routine_generation_prompt,
)
from services.exercise_api import get_exercises_by_equipment
from schemas.models import (
    SetAnalysisRequest,
    SessionSummaryRequest,
    RoutineGenerationRequest,
    CoachApiResponse,
    CoachResponseData,
    GeneratedRoutine,
    RoutineSession,
    RoutineExercise,
)
from config import get_settings

router   = APIRouter(prefix="/coach", tags=["AI Coach"])
settings = get_settings()
logger   = structlog.get_logger()

# Mapa de equipos FitForge → ExerciseDB naming
EQUIPMENT_MAP = {
    "BARBELL":   "barbell",
    "DUMBBELL":  "dumbbell",
    "CABLE":     "cable",
    "MACHINE":   "leverage machine",
    "KETTLEBELL":"kettlebell",
    "BODYWEIGHT": "body weight",
}


def _parse_coach_json(raw: str, fallback_summary: str = "") -> dict:
    """
    Extrae el JSON de la respuesta del LLM.
    El LLM puede incluir backticks o texto extra — los eliminamos.
    """
    # Intentar extraer el bloque JSON
    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Fallback si el LLM no devolvió JSON válido
    return {
        "summary": fallback_summary or raw[:200],
        "insights": [],
        "recommendations": [],
        "warnings": [],
        "motivation": "Keep pushing forward!",
    }


# ── POST /coach/analyze ───────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=CoachApiResponse,
    summary="Real-time AI feedback after each set (LLM-powered)",
)
async def analyze_set(
    req: SetAnalysisRequest,
    _claims: dict = Depends(verify_jwt_token),
) -> CoachApiResponse:
    """
    Llama al LLM con los datos REALES del set actual (peso, reps, RPE)
    para generar feedback completamente personalizado.
    Cache de 60s para no llamar varias veces al mismo set.
    """
    cache_key = _make_cache_key("analyze", {
        "user": req.userId,
        "exercise": req.exercise,
        "last_set": req.recentSets[-1].model_dump() if req.recentSets else {},
    })

    cached = await cache_get(cache_key)
    if cached:
        logger.debug("coach.analyze.cache_hit", exercise=req.exercise)
        return CoachApiResponse(data=CoachResponseData(**cached))

    try:
        user_prompt = build_set_feedback_prompt(
            exercise     = req.exercise,
            recent_sets  = [s.model_dump() for s in req.recentSets],
            fatigue_score= req.fatigueScore,
            estimated_1rm= req.estimated1RM,
            is_pr        = req.isPR,
            injury_risk  = req.injuryRisk,
            weekly_volume= req.weeklyVolume,
        )

        raw  = await ask_coach(COACH_SYSTEM, user_prompt, max_tokens=400)
        data = _parse_coach_json(raw, fallback_summary=f"Set on {req.exercise} completed.")

        logger.info(
            "coach.analyze.done",
            exercise=req.exercise,
            is_pr=req.isPR,
        )

        response_data = CoachResponseData(
            summary         = data.get("summary", ""),
            insights        = data.get("insights", []),
            recommendations = data.get("recommendations", []),
            warnings        = data.get("warnings", []),
            motivation      = data.get("motivation", ""),
            llm_provider    = settings.openrouter_model,
        )

        await cache_set(cache_key, response_data.model_dump(), settings.cache_ttl_coach)
        return CoachApiResponse(data=response_data)

    except Exception as e:
        logger.error("coach.analyze.error", error=str(e))
        raise HTTPException(status_code=503, detail=f"AI Coach unavailable: {e}")


# ── POST /coach/session ───────────────────────────────────────────────────────

@router.post(
    "/session",
    response_model=CoachApiResponse,
    summary="Session summary after workout completion (LLM-powered)",
)
async def session_summary(
    req: SessionSummaryRequest,
    _claims: dict = Depends(verify_jwt_token),
) -> CoachApiResponse:
    """
    Genera un resumen completo de la sesión al finalizar el entrenamiento.
    Analiza todos los ejercicios, series, y PRs de la sesión.
    """
    try:
        user_prompt = build_session_summary_prompt(
            exercises    = [ex.model_dump() for ex in req.exercises],
            duration_min = req.durationMin,
            total_volume = req.totalVolume,
        )

        raw  = await ask_coach(COACH_SYSTEM, user_prompt, max_tokens=600)
        data = _parse_coach_json(raw, fallback_summary="Great workout session completed!")

        logger.info(
            "coach.session.done",
            user_id=req.userId,
            exercises_count=len(req.exercises),
            duration_min=req.durationMin,
        )

        response_data = CoachResponseData(
            summary         = data.get("summary", ""),
            insights        = data.get("insights", []),
            recommendations = data.get("recommendations", []),
            warnings        = data.get("warnings", []),
            motivation      = data.get("motivation", ""),
            llm_provider    = settings.openrouter_model,
        )

        return CoachApiResponse(data=response_data)

    except Exception as e:
        logger.error("coach.session.error", error=str(e))
        raise HTTPException(status_code=503, detail=f"Session summary unavailable: {e}")


# ── POST /coach/routine ───────────────────────────────────────────────────────

@router.post(
    "/routine",
    response_model=GeneratedRoutine,
    summary="Generate a science-based routine during onboarding (LLM + ExerciseDB)",
)
async def generate_routine(
    req: RoutineGenerationRequest,
    _claims: dict = Depends(verify_jwt_token),
) -> GeneratedRoutine:
    """
    Genera una rutina de entrenamiento personalizada al finalizar el onboarding.
    Combina los datos del perfil del usuario con ejercicios reales de ExerciseDB
    y genera la estructura con el LLM.
    """
    cache_key = _make_cache_key("routine", {
        "goal": req.goal,
        "level": req.trainingLevel,
        "days": req.daysPerWeek,
        "equipment": sorted(req.availableEquipment),
    })

    cached = await cache_get(cache_key)
    if cached:
        logger.debug("coach.routine.cache_hit", goal=req.goal)
        return GeneratedRoutine(**cached)

    # Obtener ejercicios de ExerciseDB según el equipo disponible
    available_exercises: list[dict] = []
    equipment_to_query = req.availableEquipment if req.availableEquipment else ["BARBELL", "DUMBBELL"]

    for equipment in equipment_to_query[:3]:  # Máximo 3 para no sobrecargar la API
        mapped = EQUIPMENT_MAP.get(equipment.upper(), "barbell")
        exercises = await get_exercises_by_equipment(mapped, limit=10)
        available_exercises.extend(exercises)

    # Si no hay equipo o falla la API, usar lista básica
    if not available_exercises:
        available_exercises = [
            {"name": "Bench Press", "target": "pectorals", "equipment": "barbell"},
            {"name": "Squat", "target": "quads", "equipment": "barbell"},
            {"name": "Deadlift", "target": "glutes", "equipment": "barbell"},
            {"name": "Pull Up", "target": "lats", "equipment": "body weight"},
            {"name": "Overhead Press", "target": "shoulders", "equipment": "barbell"},
            {"name": "Romanian Deadlift", "target": "hamstrings", "equipment": "barbell"},
            {"name": "Dumbbell Row", "target": "back", "equipment": "dumbbell"},
            {"name": "Dumbbell Curl", "target": "biceps", "equipment": "dumbbell"},
        ]

    try:
        user_prompt = build_routine_generation_prompt(
            goal                = req.goal,
            training_level      = req.trainingLevel,
            gender              = req.gender,
            age                 = req.age,
            weight_kg           = req.weightKg,
            goal_weight_kg      = req.goalWeightKg,
            days_per_week       = req.daysPerWeek,
            available_exercises = available_exercises,
        )

        raw     = await ask_coach(COACH_SYSTEM, user_prompt, max_tokens=1500)
        routine = _parse_coach_json(raw)

        logger.info(
            "coach.routine.done",
            user_id=req.userId,
            goal=req.goal,
            days=req.daysPerWeek,
        )

        # Construir el objeto Pydantic con validación
        sessions = []
        for session_data in routine.get("sessions", []):
            exercises = [
                RoutineExercise(
                    name         = ex.get("name", ""),
                    sets         = ex.get("sets", 3),
                    reps         = str(ex.get("reps", "8-10")),
                    rir          = ex.get("rir", 2),
                    rest_seconds = ex.get("rest_seconds", 90),
                    notes        = ex.get("notes", ""),
                )
                for ex in session_data.get("exercises", [])
            ]
            sessions.append(RoutineSession(
                day_label = session_data.get("day_label", "Training Day"),
                exercises = exercises,
            ))

        result = GeneratedRoutine(
            routine_name      = routine.get("routine_name", "AI Personalized Plan"),
            weeks_duration    = routine.get("weeks_duration", 8),
            days_per_week     = req.daysPerWeek,
            sessions          = sessions,
            progression_notes = routine.get("progression_notes", ""),
            general_notes     = routine.get("general_notes", ""),
            llm_provider      = settings.openrouter_model,
        )

        await cache_set(cache_key, result.model_dump(), settings.cache_ttl_routine)
        return result

    except Exception as e:
        logger.error("coach.routine.error", error=str(e))
        raise HTTPException(status_code=503, detail=f"Routine generation unavailable: {e}")
