# Engines package
from engines.progressive_overload import (
    calculate_progression,
    calculate_next_set_suggestion,
)
from engines.volume_analysis import analyze_weekly_volume
from engines.fatigue_detection import detect_fatigue
from engines.recovery_prediction import predict_muscle_recovery
from engines.injury_risk import calculate_injury_risk
from engines.pr_prediction import predict_pr
from engines.recommendation_engine import (
    get_progression_recommendation,
    get_volume_analysis,
    get_fatigue_assessment,
    get_next_set_suggestion,
    get_recovery_prediction,
    get_injury_risk_assessment,
    get_pr_prediction,
)

__all__ = [
    # Core engine functions
    "calculate_progression",
    "calculate_next_set_suggestion",
    "analyze_weekly_volume",
    "detect_fatigue",
    "predict_muscle_recovery",
    "calculate_injury_risk",
    "predict_pr",
    # Orchestrator functions
    "get_progression_recommendation",
    "get_volume_analysis",
    "get_fatigue_assessment",
    "get_next_set_suggestion",
    "get_recovery_prediction",
    "get_injury_risk_assessment",
    "get_pr_prediction",
]
