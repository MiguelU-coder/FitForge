# ai-service/engines/recovery_prediction.py
"""
Recovery Prediction Engine
==========================
Predicts muscle recovery time based on:
1. Training volume and intensity per muscle group
2. Time since last training that muscle group
3. Historical recovery patterns
4. User's recovery baseline

Based on:
- Muscle protein synthesis timeline (24-72 hours)
- NSCA recovery guidelines
- Training frequency recommendations
"""
from __future__ import annotations
from datetime import date, timedelta
from typing import Optional
from schemas.workout_schema import (
    MuscleRecoveryInput,
    MuscleRecoveryStatus,
    RecoveryPrediction,
)


# Recovery time in hours per muscle group (base estimates)
# These are for intermediate lifters; advanced lifters may recover faster
RECOVERY_HOURS: dict[str, dict[str, int]] = {
    "CHEST": {"min": 24, "max": 48, "intensity_factor": 1.2},
    "BACK": {"min": 24, "max": 48, "intensity_factor": 1.1},
    "SHOULDERS": {"min": 24, "max": 48, "intensity_factor": 1.3},
    "BICEPS": {"min": 24, "max": 36, "intensity_factor": 1.0},
    "TRICEPS": {"min": 24, "max": 36, "intensity_factor": 1.0},
    "QUADS": {"min": 36, "max": 72, "intensity_factor": 1.4},
    "HAMSTRINGS": {"min": 36, "max": 72, "intensity_factor": 1.3},
    "GLUTES": {"min": 36, "max": 60, "intensity_factor": 1.2},
    "CALVES": {"min": 24, "max": 48, "intensity_factor": 1.0},
    "ABS": {"min": 24, "max": 36, "intensity_factor": 0.8},
    "TRAPS": {"min": 24, "max": 36, "intensity_factor": 0.9},
    "FOREARMS": {"min": 12, "max": 24, "intensity_factor": 0.5},
}

DEFAULT_RECOVERY = {"min": 24, "max": 48, "intensity_factor": 1.0}


def _get_recovery_params(muscle_group: str) -> dict:
    """Get recovery parameters for a muscle group."""
    normalized = muscle_group.upper().strip()
    return RECOVERY_HOURS.get(normalized, DEFAULT_RECOVERY)


def _calculate_recovery_hours(
    base_min: int,
    base_max: int,
    intensity_modifier: float,
    volume_modifier: float,
    days_since_training: int,
) -> tuple[int, int]:
    """
    Calculate adjusted recovery hours based on training factors.
    Returns (min_hours, max_hours).
    """
    # Adjust based on intensity
    intensity_multiplier = intensity_modifier

    # Volume adds to recovery time
    volume_additional = min(volume_modifier * 4, 24)  # Cap at 24 hours extra

    # If more than 5 days since training, recovery is complete
    if days_since_training >= 5:
        return 0, 0

    min_hours = int(base_min * intensity_multiplier + volume_additional)
    max_hours = int(base_max * intensity_multiplier + volume_additional)

    # Cap at reasonable maximum
    min_hours = min(min_hours, 96)
    max_hours = min(max_hours, 120)

    return min_hours, max_hours


def _estimate_intensity_from_rir(rir: int) -> float:
    """Estimate intensity (1-10) from RIR."""
    if rir is None:
        return 5.0
    # Lower RIR = higher intensity
    # RIR 0 = ~10 intensity, RIR 5 = ~5 intensity
    return max(1.0, min(10.0, 10.0 - rir))


def predict_muscle_recovery(
    user_id: str,
    muscle_data: list[MuscleRecoveryInput],
    current_date: Optional[str] = None,
) -> RecoveryPrediction:
    """
    Predict recovery status for each muscle group.

    Args:
        user_id: User identifier
        muscle_data: List of muscle groups with recent training info
        current_date: Today's date (defaults to now)

    Returns:
        RecoveryPrediction with status per muscle group
    """
    if current_date is None:
        current_date = date.today().isoformat()

    today = date.fromisoformat(current_date)
    muscle_statuses: list[MuscleRecoveryStatus] = []
    fully_recovered_count = 0
    partially_recovered_count = 0

    for muscle in muscle_data:
        params = _get_recovery_params(muscle.muscle_group)

        # Calculate days since last training
        try:
            last_trained = date.fromisoformat(muscle.last_trained_date)
            days_since = (today - last_trained).days
        except (ValueError, TypeError):
            days_since = 7  # Default to 7 days if unknown

        # Calculate intensity modifier based on average RIR
        avg_rir = muscle.avg_rir_last_session
        intensity = _estimate_intensity_from_rir(avg_rir) if avg_rir is not None else 5.0

        # Volume modifier: more sets = more recovery needed
        volume_modifier = min(muscle.sets_last_session / 15, 2.0)  # Cap at 2x

        # Calculate recovery window
        min_hours, max_hours = _calculate_recovery_hours(
            base_min=params["min"],
            base_max=params["max"],
            intensity_modifier=intensity / 10 * params["intensity_factor"],
            volume_modifier=volume_modifier,
            days_since_training=days_since,
        )

        # Determine status
        hours_since_training = days_since * 24

        if hours_since_training >= max_hours:
            status = "FULLY_RECOVERED"
            fully_recovered_count += 1
            hours_remaining = 0
        elif hours_since_training >= min_hours:
            status = "RECOVERING"
            partially_recovered_count += 1
            hours_remaining = max_hours - hours_since_training
        else:
            status = "FATIGUED"
            hours_remaining = min_hours - hours_since_training

        # Generate recommendation
        recommendation = _get_recovery_recommendation(
            status=status,
            muscle=muscle.muscle_group,
            hours_remaining=hours_remaining,
            days_since=days_since,
        )

        muscle_statuses.append(MuscleRecoveryStatus(
            muscle_group=muscle.muscle_group,
            status=status,
            hours_until_recovered=hours_remaining,
            last_trained_days_ago=days_since,
            sets_last_session=muscle.sets_last_session,
            avg_rir=muscle.avg_rir_last_session,
            recommendation=recommendation,
        ))

    # Overall recovery score (0-100)
    total_muscles = len(muscle_data)
    if total_muscles > 0:
        recovery_score = (fully_recovered_count / total_muscles) * 100
    else:
        recovery_score = 100.0

    # Generate overall recommendation
    overall_recommendation = _get_overall_recommendation(
        recovery_score=recovery_score,
        fully_recovered=fully_recovered_count,
        partially=partially_recovered_count,
        total=total_muscles,
    )

    return RecoveryPrediction(
        user_id=user_id,
        date=current_date,
        overall_recovery_score=round(recovery_score, 1),
        muscle_statuses=muscle_statuses,
        recommendation=overall_recommendation,
    )


def _get_recovery_recommendation(
    status: str,
    muscle: str,
    hours_remaining: int,
    days_since: int,
) -> str:
    """Generate recommendation for a specific muscle group."""
    muscle_name = muscle.capitalize()

    if status == "FULLY_RECOVERED":
        return f"{muscle_name} is fully recovered. Ready for high-intensity training!"
    elif status == "RECOVERING":
        hours_text = f"{hours_remaining}h" if hours_remaining < 24 else f"{hours_remaining // 24}d"
        return f"{muscle_name} is recovering (~{hours_text} remaining). Light work is okay."
    else:  # FATIGUED
        if hours_remaining < 12:
            return f"{muscle_name} needs rest. ~{hours_remaining}h more. Avoid heavy {muscle_name} work."
        else:
            days_text = f"{hours_remaining // 24}d"
            return f"{muscle_name} is fatigued. Rest for ~{days_text}. Consider active recovery."


def _get_overall_recommendation(
    recovery_score: float,
    fully_recovered: int,
    partially: int,
    total: int,
) -> str:
    """Generate overall recovery recommendation."""
    if recovery_score >= 80:
        return (
            f"Great recovery! {fully_recovered}/{total} muscle groups fully recovered. "
            f"Push hard today!"
        )
    elif recovery_score >= 50:
        return (
            f"Moderate recovery. {fully_recovered} fully, {partially} recovering. "
            f"Listen to your body and adjust intensity."
        )
    elif recovery_score >= 25:
        return (
            f"Low recovery status. Only {fully_recovered}/{total} ready. "
            f"Consider active recovery or deload day."
        )
    else:
        return (
            f"Recovery needed! Most muscles are still fatigued. "
            f"Take a rest day or focus on light cardio."
        )
