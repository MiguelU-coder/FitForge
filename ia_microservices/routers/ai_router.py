# ai-service/routers/ai_router.py
"""
AI Router — all /ai/* endpoints.

Endpoints:
  POST /ai/progression          → Progressive overload recommendation
  POST /ai/suggestion           → Real-time next-set suggestion
  POST /ai/volume               → Weekly volume MEV/MAV/MRV analysis
  POST /ai/fatigue              → Accumulated fatigue assessment
  POST /ai/recovery             → Muscle recovery prediction
  POST /ai/injury-risk          → Injury risk assessment
  POST /ai/pr-prediction        → Personal record prediction
  DELETE /ai/cache/{user_id}    → Invalidate user's cached results
"""
from __future__ import annotations
import structlog
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import verify_jwt_token
from middleware.cache import cache_get, cache_set, cache_delete_pattern, _make_cache_key
from engines.recommendation_engine import (
    get_progression_recommendation,
    get_volume_analysis,
    get_fatigue_assessment,
    get_next_set_suggestion,
    get_recovery_prediction,
    get_injury_risk_assessment,
    get_pr_prediction,
)
from schemas.workout_schema import (
    ProgressionRequest,
    ProgressionRecommendation,
    VolumeAnalysisRequest,
    VolumeAnalysisResponse,
    FatigueRequest,
    FatigueAssessment,
    WorkoutSuggestionRequest,
    WorkoutSuggestion,
    RecoveryRequest,
    RecoveryPrediction,
    InjuryRiskRequest,
    InjuryRiskInput,
    InjuryRiskAssessment,
    PRPredictionRequest,
    PRPrediction,
)
from config import get_settings

router   = APIRouter(prefix="/ai", tags=["AI"])
logger   = structlog.get_logger()
settings = get_settings()


# ── Progressive overload ──────────────────────────────────────────────────────

@router.post(
    "/progression",
    response_model=ProgressionRecommendation,
    summary="Get progressive overload recommendation for an exercise",
)
async def progression_recommendation(
    req: ProgressionRequest,
    _claims: dict = Depends(verify_jwt_token),
):
    """
    Analyzes the last N sessions for an exercise and returns
    a concrete weight/reps recommendation for the next session.

    Cache TTL: 1 hour (invalidated when new workout is logged).
    """
    cache_key = _make_cache_key("progression", req.model_dump())
    cached    = await cache_get(cache_key)
    if cached:
        logger.info("progression.cache_hit", exercise_id=req.exercise_id)
        return cached

    try:
        result = get_progression_recommendation(req)
        logger.info(
            "progression.computed",
            exercise_id=req.exercise_id,
            action=result.action,
            confidence=result.confidence,
        )
        await cache_set(cache_key, result.model_dump(), settings.cache_ttl_recommendation)
        return result

    except Exception as e:
        logger.error("progression.error", error=str(e), exercise_id=req.exercise_id)
        raise HTTPException(status_code=500, detail=f"Progression calculation failed: {e}")


# ── Real-time next-set suggestion ─────────────────────────────────────────────

@router.post(
    "/suggestion",
    response_model=WorkoutSuggestion,
    summary="Real-time suggestion for the next set (called during active workout)",
)
async def next_set_suggestion(
    req: WorkoutSuggestionRequest,
    _claims: dict = Depends(verify_jwt_token),
):
    """
    Called after each set is logged during an active workout.
    Returns immediate suggestion for the next set weight/reps.
    NOT cached (real-time, changes with each set).
    """
    try:
        result = get_next_set_suggestion(req)
        logger.info(
            "suggestion.computed",
            exercise_id=req.exercise_id,
            suggested_weight=result.suggested_weight,
        )
        return result

    except Exception as e:
        logger.error("suggestion.error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Suggestion failed: {e}")


# ── Volume analysis ───────────────────────────────────────────────────────────

@router.post(
    "/volume",
    response_model=VolumeAnalysisResponse,
    summary="Analyze weekly volume against MEV/MAV/MRV landmarks",
)
async def volume_analysis(
    req: VolumeAnalysisRequest,
    _claims: dict = Depends(verify_jwt_token),
):
    """
    Analyzes current week's volume per muscle group.
    Returns status (BELOW_MEV, IN_MEV_MAV, IN_MAV_MRV, ABOVE_MRV)
    and concrete recommendations.
    Cache TTL: 30 minutes.
    """
    cache_key = _make_cache_key("volume", req.model_dump())
    cached    = await cache_get(cache_key)
    if cached:
        logger.info("volume.cache_hit", user_id=req.user_id)
        return cached

    try:
        result = get_volume_analysis(req)
        logger.info(
            "volume.computed",
            user_id=req.user_id,
            overall_fatigue=result.overall_fatigue,
        )
        await cache_set(cache_key, result.model_dump(), settings.cache_ttl_volume)
        return result

    except Exception as e:
        logger.error("volume.error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Volume analysis failed: {e}")


# ── Fatigue assessment ────────────────────────────────────────────────────────

@router.post(
    "/fatigue",
    response_model=FatigueAssessment,
    summary="Assess accumulated fatigue using ACWR methodology",
)
async def fatigue_assessment(
    req: FatigueRequest,
    _claims: dict = Depends(verify_jwt_token),
):
    """
    Uses Acute:Chronic Workload Ratio to detect overreaching.
    Also analyzes RPE trends and session frequency.
    Cache TTL: 1 hour.
    """
    cache_key = _make_cache_key("fatigue", req.model_dump())
    cached    = await cache_get(cache_key)
    if cached:
        logger.info("fatigue.cache_hit", user_id=req.user_id)
        return cached

    try:
        result = get_fatigue_assessment(req)
        logger.info(
            "fatigue.computed",
            user_id=req.user_id,
            level=result.fatigue_level,
            score=result.score,
        )
        await cache_set(cache_key, result.model_dump(), settings.cache_ttl_recommendation)
        return result

    except Exception as e:
        logger.error("fatigue.error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Fatigue assessment failed: {e}")


# ── Recovery prediction ──────────────────────────────────────────────────────

@router.post(
    "/recovery",
    response_model=RecoveryPrediction,
    summary="Predict muscle recovery status for each muscle group",
)
async def recovery_prediction(
    req: RecoveryRequest,
    _claims: dict = Depends(verify_jwt_token),
):
    """
    Predicts when each muscle group will be fully recovered
    based on training volume, intensity, and time since last session.
    Body: { userId, muscleData } (Nest sends single JSON body).
    Cache TTL: 30 minutes.
    """
    cache_key = _make_cache_key("recovery", {"user_id": req.user_id, "muscles": [m.model_dump() for m in req.muscle_data]})
    cached    = await cache_get(cache_key)
    if cached:
        logger.info("recovery.cache_hit", user_id=req.user_id)
        return cached

    try:
        result = get_recovery_prediction(user_id=req.user_id, muscle_data=req.muscle_data)
        logger.info(
            "recovery.computed",
            user_id=req.user_id,
            overall_score=result.overall_recovery_score,
        )
        await cache_set(cache_key, result.model_dump(), settings.cache_ttl_volume)
        return result

    except Exception as e:
        logger.error("recovery.error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Recovery prediction failed: {e}")


# ── Injury risk assessment ───────────────────────────────────────────────────

def _injury_request_to_input(r: InjuryRiskRequest) -> InjuryRiskInput:
    """Map flat request body (from Nest) to InjuryRiskInput."""
    return InjuryRiskInput(
        acwr=r.acwr,
        current_week_volume=r.current_week_volume,
        average_weekly_volume=r.average_weekly_volume,
        previous_week_volume=r.previous_week_volume,
        consecutive_heavy_sessions=r.consecutive_heavy_sessions,
        sleep_quality_score=r.sleep_quality_score,
        stress_level=r.stress_level,
        sessions_per_week=r.sessions_per_week,
        days_since_last_session=r.days_since_last_session,
        exercise_risks=r.exercise_risks,
    )


@router.post(
    "/injury-risk",
    response_model=InjuryRiskAssessment,
    summary="Assess injury risk based on workload and other factors",
)
async def injury_risk_assessment(
    req: InjuryRiskRequest,
    _claims: dict = Depends(verify_jwt_token),
):
    """
    Calculates injury risk based on ACWR, volume spikes,
    fatigue, training frequency, and exercise-specific factors.
    Body: { userId, acwr, currentWeekVolume, ... } (Nest sends single JSON body).
    Cache TTL: 1 hour.
    """
    cache_key = _make_cache_key("injury-risk", {"user_id": req.user_id, "data": req.model_dump()})
    cached    = await cache_get(cache_key)
    if cached:
        logger.info("injury-risk.cache_hit", user_id=req.user_id)
        return cached

    try:
        risk_data = _injury_request_to_input(req)
        result = get_injury_risk_assessment(user_id=req.user_id, risk_data=risk_data)
        logger.info(
            "injury-risk.computed",
            user_id=req.user_id,
            risk_level=result.overall_risk_level,
            risk_score=result.risk_score,
        )
        await cache_set(cache_key, result.model_dump(), settings.cache_ttl_recommendation)
        return result

    except Exception as e:
        logger.error("injury-risk.error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Injury risk assessment failed: {e}")


# ── PR prediction ───────────────────────────────────────────────────────────

@router.post(
    "/pr-prediction",
    response_model=PRPrediction,
    summary="Predict when user is likely to hit a new personal record",
)
async def pr_prediction(
    request: PRPredictionRequest,
    _claims: dict = Depends(verify_jwt_token),
):
    """
    Predicts probability of hitting a new PR based on:
    - Current progression rate
    - Training age/experience
    - PR history
    - Current performance
    Body: { userId, exerciseId, exerciseName, ... } (Nest sends single JSON body).
    Cache TTL: 2 hours (PRs don't change frequently).
    """
    cache_key = _make_cache_key("pr-prediction", {"user_id": request.user_id, "request": request.model_dump()})
    cached    = await cache_get(cache_key)
    if cached:
        logger.info("pr-prediction.cache_hit", user_id=request.user_id)
        return cached

    try:
        result = get_pr_prediction(user_id=request.user_id, request=request)
        logger.info(
            "pr-prediction.computed",
            user_id=request.user_id,
            exercise_id=request.exercise_id,
            prob_30_days=result.pr_probability_30_days,
            confidence=result.confidence,
        )
        await cache_set(cache_key, result.model_dump(), 7200)  # 2 hours
        return result

    except Exception as e:
        logger.error("pr-prediction.error", error=str(e))
        raise HTTPException(status_code=500, detail=f"PR prediction failed: {e}")


# ── Cache invalidation ────────────────────────────────────────────────────────

@router.delete(
    "/cache/{user_id}",
    summary="Invalidate all cached AI results for a user",
    status_code=204,
)
async def invalidate_cache(
    user_id: str,
    _claims: dict = Depends(verify_jwt_token),
):
    """
    Called by NestJS after a workout is finished.
    Clears stale progression/volume/fatigue/recovery/injury/pr recommendations.
    """
    await cache_delete_pattern(f"ai:*:{user_id}:*")
    logger.info("cache.invalidated", user_id=user_id)
