# ai-service/schemas/workout_schema.py
from __future__ import annotations
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from enum import Enum


# ── Enums ─────────────────────────────────────────────────────────────────────

class SetType(str, Enum):
    WARMUP  = "WARMUP"
    WORKING = "WORKING"
    DROP    = "DROP"
    FAILURE = "FAILURE"


class EquipmentType(str, Enum):
    BARBELL        = "BARBELL"
    DUMBBELL       = "DUMBBELL"
    CABLE          = "CABLE"
    MACHINE        = "MACHINE"
    BODYWEIGHT     = "BODYWEIGHT"
    KETTLEBELL     = "KETTLEBELL"
    RESISTANCE_BAND = "RESISTANCE_BAND"


# ── Input schemas ─────────────────────────────────────────────────────────────

class SetInput(BaseModel):
    """A single logged set (accepts camelCase from Nest)."""
    model_config = ConfigDict(populate_by_name=True)
    set_number: int   = Field(ge=1, alias="setNumber")
    set_type:   SetType = Field(default=SetType.WORKING, alias="setType")
    weight_kg:  Optional[float] = Field(default=None, ge=0, le=1000, alias="weightKg")
    reps:       Optional[int]   = Field(default=None, ge=0, le=200)
    rir:        Optional[int]   = Field(default=None, ge=0, le=10)
    rpe:        Optional[float] = Field(default=None, ge=1, le=10)
    duration_s: Optional[int]   = Field(default=None, alias="durationS")


class ExerciseHistoryEntry(BaseModel):
    """One exercise block from a past session."""
    model_config = ConfigDict(populate_by_name=True)
    session_date:   str   = Field(alias="sessionDate")   # ISO date "2025-01-15"
    exercise_id:    str   = Field(alias="exerciseId")
    exercise_name:  str   = Field(alias="exerciseName")
    equipment:      Optional[EquipmentType] = None
    primary_muscles: list[str] = Field(default_factory=list, alias="primaryMuscles")
    sets:           list[SetInput]


class ProgressionRequest(BaseModel):
    """
    Request for progressive overload recommendation for ONE exercise.
    Accepts camelCase from Nest (userId, exerciseId, history, targetRir, ...).
    """
    model_config = ConfigDict(populate_by_name=True)
    user_id:       str = Field(alias="userId")
    exercise_id:   str = Field(alias="exerciseId")
    exercise_name: str = Field(alias="exerciseName")
    equipment:     Optional[EquipmentType] = None
    history:       list[ExerciseHistoryEntry] = Field(
        description="Sessions ordered oldest → newest. Min 1, recommended 5+"
    )
    target_rir:    int   = Field(default=2, ge=0, le=5, alias="targetRir")
    target_reps:   int   = Field(default=8, ge=1, le=50, alias="targetReps")
    weight_increment: float = Field(default=2.5, ge=0.5, le=10, alias="weightIncrement")

    @field_validator("history")
    @classmethod
    def at_least_one_session(cls, v: list) -> list:
        if len(v) == 0:
            raise ValueError("At least one history session required")
        return v


class MuscleVolumeInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    muscle_group: str = Field(alias="muscleGroup")
    total_sets:   int  = Field(ge=0, alias="totalSets")
    total_reps:   int  = Field(ge=0, alias="totalReps")
    total_volume_kg: float = Field(ge=0, alias="totalVolumeKg")


class VolumeAnalysisRequest(BaseModel):
    """Weekly volume per muscle group for MEV/MAV/MRV analysis."""
    model_config = ConfigDict(populate_by_name=True)
    user_id:        str = Field(alias="userId")
    week_start:     str = Field(alias="weekStart")   # ISO date "2025-01-13"
    muscle_volumes: list[MuscleVolumeInput] = Field(alias="muscleVolumes")


class SessionLoad(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    date:            str
    total_sets:      int   = Field(alias="totalSets")
    total_volume_kg: float = Field(alias="totalVolumeKg")
    rpe_avg:         Optional[float] = Field(default=None, alias="rpeAvg")
    duration_min:    Optional[int]   = Field(default=None, alias="durationMin")


class FatigueRequest(BaseModel):
    """Detect accumulated fatigue based on recent training load."""
    model_config = ConfigDict(populate_by_name=True)
    user_id:    str = Field(alias="userId")
    sessions:   list[SessionLoad]


class WorkoutSuggestionRequest(BaseModel):
    """
    Real-time suggestion during a workout (accepts camelCase from Nest).
    """
    model_config = ConfigDict(populate_by_name=True)
    user_id:       str = Field(alias="userId")
    exercise_id:   str = Field(alias="exerciseId")
    exercise_name: str = Field(alias="exerciseName")
    target_reps:   int   = Field(default=8, alias="targetReps")
    target_rir:    int   = Field(default=2, alias="targetRir")
    sets_done_today: list[SetInput]       = Field(alias="setsDoneToday")
    last_session_sets: list[SetInput] = Field(default_factory=list, alias="lastSessionSets")


# ── Output schemas ────────────────────────────────────────────────────────────

class ProgressionRecommendation(BaseModel):
    exercise_id:   str
    exercise_name: str
    action:        str   # "INCREASE_WEIGHT" | "MAINTAIN" | "DELOAD" | "CHANGE_REPS"
    suggested_weight_kg: Optional[float] = None
    suggested_reps:      Optional[int]   = None
    suggested_rir:       Optional[int]   = None
    confidence:          float  = Field(ge=0, le=1)
    reasoning:           str
    display_message:     str   # short UI message like "Try 82.5kg next set "


class MuscleVolumeStatus(BaseModel):
    muscle_group:    str
    total_sets:      int
    status:          str   # "BELOW_MEV" | "IN_MEV_MAV" | "IN_MAV_MRV" | "ABOVE_MRV"
    mev:             int   # Minimum Effective Volume (sets/week)
    mav:             int   # Maximum Adaptive Volume
    mrv:             int   # Maximum Recoverable Volume
    recommendation:  str


class VolumeAnalysisResponse(BaseModel):
    user_id:         str
    week_start:      str
    muscle_statuses: list[MuscleVolumeStatus]
    overall_fatigue: str   # "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
    weekly_summary:  str


class FatigueAssessment(BaseModel):
    user_id:        str
    fatigue_level:  str   # "RECOVERED" | "NORMAL" | "ACCUMULATED" | "OVERREACHED"
    score:          float  = Field(ge=0, le=10)
    recommendation: str
    days_to_deload: Optional[int] = None


class WorkoutSuggestion(BaseModel):
    exercise_id:      str
    suggested_weight: Optional[float] = None
    suggested_reps:   Optional[int]   = None
    suggested_rir:    Optional[int]   = None
    message:          str   # e.g. "Try 80kg × 8 — RIR was 3 last time"
    confidence:       float = Field(ge=0, le=1)
    reasoning:        str


# ── Recovery Prediction schemas ────────────────────────────────────────────────

class MuscleRecoveryInput(BaseModel):
    """Input for recovery prediction per muscle group."""
    model_config = ConfigDict(populate_by_name=True)
    muscle_group: str = Field(alias="muscleGroup")
    last_trained_date: str = Field(alias="lastTrainedDate")  # ISO date
    sets_last_session: int = Field(ge=0, alias="setsLastSession")
    avg_rir_last_session: Optional[int] = Field(default=None, ge=0, le=10, alias="avgRirLastSession")


class RecoveryRequest(BaseModel):
    """Single body for /recovery (Nest sends { userId, muscleData })."""
    model_config = ConfigDict(populate_by_name=True)
    user_id: str = Field(alias="userId")
    muscle_data: list[MuscleRecoveryInput] = Field(alias="muscleData")


class MuscleRecoveryStatus(BaseModel):
    """Recovery status for a specific muscle group."""
    muscle_group: str
    status: str  # "FULLY_RECOVERED" | "RECOVERING" | "FATIGUED"
    hours_until_recovered: int
    last_trained_days_ago: int
    sets_last_session: int
    avg_rir: Optional[int] = None
    recommendation: str


class RecoveryPrediction(BaseModel):
    """Overall recovery prediction response."""
    user_id: str
    date: str
    overall_recovery_score: float  # 0-100
    muscle_statuses: list[MuscleRecoveryStatus]
    recommendation: str


# ── Injury Risk Assessment schemas ─────────────────────────────────────────────

class ExerciseRiskFactor(BaseModel):
    """Risk factors for a specific exercise."""
    model_config = ConfigDict(populate_by_name=True)
    exercise_id: str = Field(alias="exerciseId")
    exercise_name: str = Field(alias="exerciseName")
    sets_this_week: Optional[int] = Field(default=None, alias="setsThisWeek")
    rir_trend: Optional[str] = Field(default=None, alias="rirTrend")  # "increasing", "stable", "decreasing"
    has_injury_history: bool = Field(default=False, alias="hasInjuryHistory")
    equipment_condition: Optional[str] = Field(default=None, alias="equipmentCondition")  # "good", "fair", "poor"


class InjuryRiskInput(BaseModel):
    """Input for injury risk assessment."""
    acwr: Optional[float] = None  # Acute:Chronic Workload Ratio
    current_week_volume: Optional[float] = None  # Total volume this week
    average_weekly_volume: Optional[float] = None  # Average weekly volume
    previous_week_volume: Optional[float] = None
    consecutive_heavy_sessions: Optional[int] = None
    sleep_quality_score: Optional[float] = Field(default=None, ge=1, le=10)
    stress_level: Optional[int] = Field(default=None, ge=1, le=10)
    sessions_per_week: Optional[int] = None
    days_since_last_session: Optional[int] = None
    exercise_risks: Optional[list[ExerciseRiskFactor]] = None


class InjuryRiskRequest(BaseModel):
    """Single body for /injury-risk (Nest sends flat { userId, acwr, ... })."""
    model_config = ConfigDict(populate_by_name=True)
    user_id: str = Field(alias="userId")
    acwr: Optional[float] = None
    current_week_volume: Optional[float] = Field(default=None, alias="currentWeekVolume")
    average_weekly_volume: Optional[float] = Field(default=None, alias="averageWeeklyVolume")
    previous_week_volume: Optional[float] = Field(default=None, alias="previousWeekVolume")
    consecutive_heavy_sessions: Optional[int] = Field(default=None, alias="consecutiveHeavySessions")
    sleep_quality_score: Optional[float] = Field(default=None, ge=1, le=10, alias="sleepQualityScore")
    stress_level: Optional[int] = Field(default=None, ge=1, le=10, alias="stressLevel")
    sessions_per_week: Optional[int] = Field(default=None, alias="sessionsPerWeek")
    days_since_last_session: Optional[int] = Field(default=None, alias="daysSinceLastSession")
    exercise_risks: Optional[list[ExerciseRiskFactor]] = Field(default=None, alias="exerciseRisks")


class InjuryRiskAssessment(BaseModel):
    """Injury risk assessment response."""
    user_id: str
    date: str
    overall_risk_level: str  # "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL"
    risk_score: float  # 0-100
    acwr_risk: dict
    volume_spike_risk: dict
    fatigue_risk: dict
    frequency_risk: dict
    exercise_risks: list[dict]
    recommendations: list[str]
    medical_consultation_recommended: bool


# ── PR Prediction schemas ────────────────────────────────────────────────────

class CurrentPerformance(BaseModel):
    """Current performance for an exercise."""
    model_config = ConfigDict(populate_by_name=True)
    weight_kg: float = Field(alias="weightKg")
    reps: Optional[int] = None
    rir: Optional[int] = None
    date: Optional[str] = None


class PRHistoryEntry(BaseModel):
    """A personal record entry."""
    model_config = ConfigDict(populate_by_name=True)
    date: str
    weight_kg: float = Field(alias="weightKg")
    reps: int = Field(default=1)
    estimated_1rm: Optional[float] = Field(default=None, alias="estimated1Rm")


class PRPredictionRequest(BaseModel):
    """Request for PR prediction (accepts camelCase from Nest)."""
    model_config = ConfigDict(populate_by_name=True)
    user_id: str = Field(alias="userId")
    exercise_id: str = Field(alias="exerciseId")
    exercise_name: str = Field(alias="exerciseName")
    exercise_type: Optional[str] = Field(default=None, alias="exerciseType")  # "compound" or "isolation"
    equipment: Optional[EquipmentType] = None
    months_training: Optional[int] = Field(default=None, alias="monthsTraining")
    current_performance: Optional[CurrentPerformance] = Field(default=None, alias="currentPerformance")
    pr_history: Optional[list[PRHistoryEntry]] = Field(default=None, alias="prHistory")


class Estimated1RM(BaseModel):
    """Estimated one-rep max."""
    weight: float
    reps: int
    estimated_1rm: float


class PRPrediction(BaseModel):
    """PR prediction response."""
    user_id: str
    exercise_id: str
    exercise_name: str
    current_estimated_1rm: float
    current_pr_weight: Optional[float] = None
    current_pr_1rm: Optional[float] = None
    training_level: str  # "beginner", "early_intermediate", "intermediate", "advanced", "elite"
    progression_rate_kg_per_week: Optional[float] = None
    pr_probability_30_days: float  # 0-100
    pr_probability_90_days: float
    pr_probability_180_days: float
    days_estimate: Optional[int] = None
    confidence: float  # 0-1
    reasoning: str
    recommendation: str
    target_weights: dict = Field(default_factory=dict)