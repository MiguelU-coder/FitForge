# ia_coach/schemas/models.py
"""
Pydantic schemas para request/response del AI Coach.
El response es compatible con CoachResponse.fromJson() de Flutter.
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


# ── Set Analysis (POST /coach/analyze) ───────────────────────────────────────

class RecentSetInput(BaseModel):
    weight: float = Field(..., ge=0, description="Weight lifted in kg")
    reps: int     = Field(..., ge=0, description="Reps performed")
    rpe: float    = Field(..., ge=1, le=10, description="RPE 1-10")


class SetAnalysisRequest(BaseModel):
    userId:       str
    exercise:     str
    recentSets:   list[RecentSetInput] = []
    fatigueScore: float = Field(default=50.0, ge=0, le=100)
    estimated1RM: float = Field(default=0.0, ge=0)
    isPR:         bool  = False
    injuryRisk:   str   = "LOW"   # "LOW" | "MODERATE" | "HIGH"
    weeklyVolume: Optional[float] = None


# ── Session Summary (POST /coach/session) ─────────────────────────────────────

class ExerciseSessionInput(BaseModel):
    exercise: str
    sets:     list[RecentSetInput] = []
    isPR:     bool = False


class SessionSummaryRequest(BaseModel):
    userId:      str
    exercises:   list[ExerciseSessionInput]
    durationMin: Optional[int]   = None
    totalVolume: Optional[float] = None


# ── Routine Generation (POST /coach/routine) ──────────────────────────────────

class RoutineGenerationRequest(BaseModel):
    userId:            str
    goal:              str   # "BUILD_MUSCLE" | "LOSE_WEIGHT" | "STRENGTH" | "ENDURANCE"
    trainingLevel:     str   # "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
    gender:            str
    age:               Optional[int]   = None
    weightKg:          Optional[float] = None
    goalWeightKg:      Optional[float] = None
    daysPerWeek:       int = Field(default=3, ge=1, le=7)
    availableEquipment: list[str] = []   # e.g. ["BARBELL", "DUMBBELL"]


# ── Shared Coach Response ─────────────────────────────────────────────────────
# Debe coincidir exactamente con CoachResponse.fromJson() en Flutter

class CoachResponseData(BaseModel):
    summary:         str
    insights:        list[str]
    recommendations: list[str]
    warnings:        list[str]
    motivation:      str
    llm_provider:    str = "openrouter/llama-3.3-70b"


class CoachApiResponse(BaseModel):
    """Wrapper estándar que NestJS desenvuelve antes de pasar a Flutter."""
    data: CoachResponseData


# ── Routine Exercise ──────────────────────────────────────────────────────────

class RoutineExercise(BaseModel):
    name:         str
    sets:         int
    reps:         str  # e.g. "8-10"
    rir:          int
    rest_seconds: int
    notes:        str = ""


class RoutineSession(BaseModel):
    day_label:  str
    exercises:  list[RoutineExercise]


class GeneratedRoutine(BaseModel):
    routine_name:       str
    weeks_duration:     int
    days_per_week:      int
    sessions:           list[RoutineSession]
    progression_notes:  str
    general_notes:      str
    llm_provider:       str = "openrouter/llama-3.3-70b"
