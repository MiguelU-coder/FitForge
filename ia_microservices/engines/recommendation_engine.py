# ai-service/engines/recommendation_engine.py
"""
Recommendation Engine
======================
Orchestrates all AI engines and provides a unified interface.
This is the single entry point for NestJS to call.
"""
from __future__ import annotations
from schemas.workout_schema import (
    ProgressionRequest,
    ProgressionRecommendation,
    VolumeAnalysisRequest,
    VolumeAnalysisResponse,
    FatigueRequest,
    FatigueAssessment,
    WorkoutSuggestionRequest,
    WorkoutSuggestion,
    MuscleRecoveryInput,
    RecoveryPrediction,
    InjuryRiskInput,
    InjuryRiskAssessment,
    PRPredictionRequest,
    PRPrediction,
)
from engines.progressive_overload import calculate_progression, calculate_next_set_suggestion
from engines.volume_analysis import analyze_weekly_volume
from engines.fatigue_detection import detect_fatigue
from engines.recovery_prediction import predict_muscle_recovery
from engines.injury_risk import calculate_injury_risk
from engines.pr_prediction import predict_pr


# ── Progressive Overload ───────────────────────────────────────────────────────

def get_progression_recommendation(req: ProgressionRequest) -> ProgressionRecommendation:
    return calculate_progression(
        history=req.history,
        target_reps=req.target_reps,
        target_rir=req.target_rir,
        weight_increment=req.weight_increment,
        exercise_name=req.exercise_name,
        exercise_id=req.exercise_id,
        equipment=req.equipment.value if req.equipment else None,
    )


def get_next_set_suggestion(req: WorkoutSuggestionRequest) -> WorkoutSuggestion:
    return calculate_next_set_suggestion(
        sets_done_today=req.sets_done_today,
        last_session_sets=req.last_session_sets,
        exercise_id=req.exercise_id,
        target_reps=req.target_reps,
        target_rir=req.target_rir,
    )


# ── Volume Analysis ────────────────────────────────────────────────────────────

def get_volume_analysis(req: VolumeAnalysisRequest) -> VolumeAnalysisResponse:
    return analyze_weekly_volume(
        user_id=req.user_id,
        week_start=req.week_start,
        muscle_volumes=req.muscle_volumes,
    )


# ── Fatigue Detection ─────────────────────────────────────────────────────────

def get_fatigue_assessment(req: FatigueRequest) -> FatigueAssessment:
    return detect_fatigue(
        user_id=req.user_id,
        sessions=req.sessions,
    )


# ── Recovery Prediction ───────────────────────────────────────────────────────

def get_recovery_prediction(
    user_id: str,
    muscle_data: list[MuscleRecoveryInput],
    current_date: str = None,
) -> RecoveryPrediction:
    return predict_muscle_recovery(
        user_id=user_id,
        muscle_data=muscle_data,
        current_date=current_date,
    )


# ── Injury Risk Assessment ───────────────────────────────────────────────────

def get_injury_risk_assessment(
    user_id: str,
    risk_data: InjuryRiskInput,
    current_date: str = None,
) -> InjuryRiskAssessment:
    return calculate_injury_risk(
        user_id=user_id,
        risk_data=risk_data,
        current_date=current_date,
    )


# ── PR Prediction ────────────────────────────────────────────────────────────

def get_pr_prediction(
    user_id: str,
    request: PRPredictionRequest,
    current_date: str = None,
) -> PRPrediction:
    return predict_pr(
        user_id=user_id,
        request=request,
        current_date=current_date,
    )
