# Schemas package
from schemas.workout_schema import (
    # Enums
    SetType,
    EquipmentType,
    # Input
    SetInput,
    ExerciseHistoryEntry,
    ProgressionRequest,
    MuscleVolumeInput,
    VolumeAnalysisRequest,
    SessionLoad,
    FatigueRequest,
    WorkoutSuggestionRequest,
    # Output
    ProgressionRecommendation,
    MuscleVolumeStatus,
    VolumeAnalysisResponse,
    FatigueAssessment,
    WorkoutSuggestion,
)

__all__ = [
    "SetType",
    "EquipmentType",
    "SetInput",
    "ExerciseHistoryEntry",
    "ProgressionRequest",
    "MuscleVolumeInput",
    "VolumeAnalysisRequest",
    "SessionLoad",
    "FatigueRequest",
    "WorkoutSuggestionRequest",
    "ProgressionRecommendation",
    "MuscleVolumeStatus",
    "VolumeAnalysisResponse",
    "FatigueAssessment",
    "WorkoutSuggestion",
]
