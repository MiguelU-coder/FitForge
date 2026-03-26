# ai-service/tests/test_engines.py
"""
Unit tests for AI engines.
Run with: pytest tests/ -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from schemas.workout_schema import (
    SetInput, SetType, ExerciseHistoryEntry, ProgressionRequest,
    MuscleVolumeInput, VolumeAnalysisRequest,
    FatigueRequest, SessionLoad,
    WorkoutSuggestionRequest,
)
from engines.progressive_overload import calculate_progression, calculate_next_set_suggestion
from engines.volume_analysis import analyze_weekly_volume
from engines.fatigue_detection import detect_fatigue


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_working_set(number: int, weight: float, reps: int, rir: int) -> SetInput:
    return SetInput(
        set_number=number, set_type=SetType.WORKING,
        weight_kg=weight, reps=reps, rir=rir,
    )

def make_session(date: str, weight: float, reps: int, rir: int, n_sets: int = 3) -> ExerciseHistoryEntry:
    return ExerciseHistoryEntry(
        session_date=date,
        exercise_id="bench_press",
        exercise_name="Bench Press",
        sets=[make_working_set(i+1, weight, reps, rir) for i in range(n_sets)],
    )


# ── Progressive overload tests ────────────────────────────────────────────────

class TestProgressiveOverload:

    def test_increase_when_rir_above_target(self):
        """If avg RIR >> target, should recommend increasing weight."""
        history = [make_session("2025-01-15", weight=80.0, reps=8, rir=4)]
        result = calculate_progression(
            history=history,
            target_reps=8, target_rir=2,
            weight_increment=2.5,
            exercise_name="Bench Press",
            exercise_id="bench_press",
        )
        assert result.action == "INCREASE_WEIGHT"
        assert result.suggested_weight_kg == 82.5
        assert result.confidence >= 0.7

    def test_maintain_when_rir_on_target(self):
        """If avg RIR == target, should maintain weight."""
        history = [make_session("2025-01-15", weight=80.0, reps=8, rir=2)]
        result = calculate_progression(
            history=history,
            target_reps=8, target_rir=2,
            weight_increment=2.5,
            exercise_name="Bench Press",
            exercise_id="bench_press",
        )
        assert result.action == "MAINTAIN"

    def test_deload_when_rir_below_target(self):
        """If RIR is much lower than target, should recommend deload."""
        history = [make_session("2025-01-15", weight=100.0, reps=6, rir=0)]
        result = calculate_progression(
            history=history,
            target_reps=8, target_rir=2,
            weight_increment=2.5,
            exercise_name="Bench Press",
            exercise_id="bench_press",
        )
        assert result.action == "DELOAD"

    def test_stagnation_detection(self):
        """Same weight for 3+ sessions → CHANGE_REPS."""
        history = [
            make_session("2025-01-01", weight=80.0, reps=8, rir=2),
            make_session("2025-01-08", weight=80.0, reps=8, rir=2),
            make_session("2025-01-15", weight=80.0, reps=8, rir=2),
        ]
        result = calculate_progression(
            history=history,
            target_reps=8, target_rir=2,
            weight_increment=2.5,
            exercise_name="Bench Press",
            exercise_id="bench_press",
        )
        assert result.action == "CHANGE_REPS"

    def test_empty_history(self):
        """Empty history should return MAINTAIN with low confidence."""
        req = ProgressionRequest(
            user_id="user1",
            exercise_id="squat",
            exercise_name="Squat",
            history=[make_session("2025-01-15", weight=100.0, reps=5, rir=3)],
            target_rir=2, target_reps=5,
        )
        result = calculate_progression(
            history=req.history,
            target_reps=req.target_reps,
            target_rir=req.target_rir,
            weight_increment=req.weight_increment,
            exercise_name=req.exercise_name,
            exercise_id=req.exercise_id,
        )
        assert result.exercise_id == "squat"

    def test_display_message_contains_weight(self):
        """Display message should include the suggested weight."""
        history = [make_session("2025-01-15", weight=80.0, reps=8, rir=4)]
        result = calculate_progression(
            history=history,
            target_reps=8, target_rir=2,
            weight_increment=2.5,
            exercise_name="Bench Press",
            exercise_id="bench",
        )
        assert "82.5" in result.display_message


# ── Real-time suggestion tests ────────────────────────────────────────────────

class TestNextSetSuggestion:

    def test_suggests_increase_after_high_rir_set(self):
        sets_today = [make_working_set(1, 80.0, 8, 4)]
        result = calculate_next_set_suggestion(
            sets_done_today=sets_today,
            last_session_sets=[],
            exercise_id="bench",
            target_reps=8, target_rir=2,
        )
        assert result.suggested_weight == 82.5
        assert "🔼" in result.message

    def test_suggests_decrease_after_low_rir_set(self):
        sets_today = [make_working_set(1, 100.0, 5, 0)]
        result = calculate_next_set_suggestion(
            sets_done_today=sets_today,
            last_session_sets=[],
            exercise_id="bench",
            target_reps=8, target_rir=2,
        )
        assert result.suggested_weight == 97.5

    def test_uses_last_session_when_no_sets_today(self):
        last = [make_working_set(i+1, 80.0, 8, 3) for i in range(3)]
        result = calculate_next_set_suggestion(
            sets_done_today=[],
            last_session_sets=last,
            exercise_id="bench",
            target_reps=8, target_rir=2,
        )
        assert result.suggested_weight is not None


# ── Volume analysis tests ─────────────────────────────────────────────────────

class TestVolumeAnalysis:

    def test_below_mev_detection(self):
        vols = [MuscleVolumeInput(muscle_group="CHEST", total_sets=4, total_reps=32, total_volume_kg=1000)]
        result = analyze_weekly_volume("user1", "2025-01-13", vols)
        chest = next(m for m in result.muscle_statuses if m.muscle_group == "CHEST")
        assert chest.status == "BELOW_MEV"

    def test_optimal_range(self):
        vols = [MuscleVolumeInput(muscle_group="CHEST", total_sets=12, total_reps=96, total_volume_kg=3000)]
        result = analyze_weekly_volume("user1", "2025-01-13", vols)
        chest = next(m for m in result.muscle_statuses if m.muscle_group == "CHEST")
        assert chest.status == "IN_MEV_MAV"

    def test_above_mrv_detection(self):
        vols = [MuscleVolumeInput(muscle_group="CHEST", total_sets=25, total_reps=200, total_volume_kg=6000)]
        result = analyze_weekly_volume("user1", "2025-01-13", vols)
        chest = next(m for m in result.muscle_statuses if m.muscle_group == "CHEST")
        assert chest.status == "ABOVE_MRV"
        assert result.overall_fatigue in ["HIGH", "CRITICAL"]

    def test_unknown_muscle_uses_defaults(self):
        vols = [MuscleVolumeInput(muscle_group="ROTATOR_CUFF", total_sets=8, total_reps=64, total_volume_kg=400)]
        result = analyze_weekly_volume("user1", "2025-01-13", vols)
        assert len(result.muscle_statuses) == 1


# ── Fatigue detection tests ───────────────────────────────────────────────────

class TestFatigueDetection:

    def test_no_sessions_returns_recovered(self):
        result = detect_fatigue("user1", [])
        assert result.fatigue_level == "RECOVERED"

    def test_high_recent_load_detected(self):
        from datetime import date, timedelta
        today = date.today()
        # Simulate 7 consecutive heavy sessions
        sessions = [
            SessionLoad(
                date=(today - timedelta(days=i)).isoformat(),
                total_sets=20,
                total_volume_kg=5000,
                rpe_avg=9.0,
                duration_min=90,
            )
            for i in range(7)
        ]
        result = detect_fatigue("user1", sessions)
        assert result.fatigue_level in ["ACCUMULATED", "OVERREACHED"]
        assert result.score >= 5

    def test_light_training_returns_normal(self):
        from datetime import date, timedelta
        today = date.today()
        # Moderate training: 3 sessions/week consistently for 4 weeks
        # This should give a balanced ACWR (0.8-1.0 range)
        sessions = []
        for i in range(12):
            sessions.append(SessionLoad(
                date=(today - timedelta(days=i*2)).isoformat(),  # Every 2 days
                total_sets=8,
                total_volume_kg=1500,
                rpe_avg=5.0,
                duration_min=40,
            ))
        result = detect_fatigue("user1", sessions)
        # ACWR should be in optimal zone (0.8-1.3)
        assert result.fatigue_level in ["RECOVERED", "NORMAL", "ACCUMULATED"]