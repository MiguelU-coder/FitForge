# ai-service/engines/volume_analysis.py
"""
Volume Analysis Engine
=======================
Based on Dr. Mike Israetel's Volume Landmarks:
- MEV: Minimum Effective Volume — minimum sets/week to maintain/grow
- MAV: Maximum Adaptive Volume — optimal range for most lifters
- MRV: Maximum Recoverable Volume — upper limit before overtraining

References:
- Israetel, M., et al. "Scientific Principles of Strength Training" (2015)
- Schoenfeld, B.J. "Science and Development of Muscle Hypertrophy" (2016)
"""
from __future__ import annotations
from schemas.workout_schema import (
    MuscleVolumeInput,
    MuscleVolumeStatus,
    VolumeAnalysisResponse,
)


# ── Volume landmarks (sets/week) per muscle group ─────────────────────────────
# Source: Renaissance Periodization & Stronger By Science
# Values are for intermediate lifters (1-3 years training)
VOLUME_LANDMARKS: dict[str, dict[str, int]] = {
    "CHEST": {
        "mev": 8,   # Min Effective Volume
        "mav": 16,  # Max Adaptive Volume
        "mrv": 22,  # Max Recoverable Volume
    },
    "BACK": {
        "mev": 10,
        "mav": 18,
        "mrv": 25,
    },
    "SHOULDERS": {
        "mev": 8,
        "mav": 16,
        "mrv": 22,
    },
    "BICEPS": {
        "mev": 8,
        "mav": 14,
        "mrv": 20,
    },
    "TRICEPS": {
        "mev": 8,
        "mav": 14,
        "mrv": 18,
    },
    "QUADS": {
        "mev": 8,
        "mav": 16,
        "mrv": 20,
    },
    "HAMSTRINGS": {
        "mev": 6,
        "mav": 12,
        "mrv": 16,
    },
    "GLUTES": {
        "mev": 4,
        "mav": 12,
        "mrv": 16,
    },
    "CALVES": {
        "mev": 8,
        "mav": 14,
        "mrv": 20,
    },
    "ABS": {
        "mev": 0,
        "mav": 12,
        "mrv": 20,
    },
    "TRAPS": {
        "mev": 6,
        "mav": 12,
        "mrv": 18,
    },
    "FOREARMS": {
        "mev": 0,
        "mav": 8,
        "mrv": 14,
    },
}

# Default for unknown muscle groups
DEFAULT_LANDMARKS = {"mev": 6, "mav": 12, "mrv": 18}


def _get_landmarks(muscle_group: str) -> dict[str, int]:
    """Get volume landmarks, normalizing muscle group names."""
    normalized = muscle_group.upper().strip()
    return VOLUME_LANDMARKS.get(normalized, DEFAULT_LANDMARKS)


def _classify_status(sets: int, mev: int, mav: int, mrv: int) -> str:
    """Classify current volume against landmarks."""
    if sets < mev:
        return "BELOW_MEV"
    elif sets <= mav:
        return "IN_MEV_MAV"
    elif sets <= mrv:
        return "IN_MAV_MRV"
    else:
        return "ABOVE_MRV"


def _recommendation_for_status(
    status: str,
    muscle: str,
    sets: int,
    mev: int,
    mav: int,
    mrv: int,
) -> str:
    """Generate human-readable recommendation."""
    display_muscle = muscle.capitalize()

    recommendations = {
        "BELOW_MEV": (
            f"{display_muscle} volume ({sets} sets) is below MEV ({mev} sets/week). "
            f"Add {mev - sets} more sets to stimulate growth."
        ),
        "IN_MEV_MAV": (
            f"{display_muscle} is in the optimal range ({sets}/{mev}-{mav} sets). "
            f"Good stimulus for growth — maintain or gradually increase."
        ),
        "IN_MAV_MRV": (
            f"{display_muscle} is in the high range ({sets}/{mav}-{mrv} sets). "
            f"Close to MRV — monitor recovery carefully."
        ),
        "ABOVE_MRV": (
            f"{display_muscle} volume ({sets} sets) exceeds MRV ({mrv} sets/week). "
            f"Risk of overtraining — reduce by {sets - mrv} sets next week."
        ),
    }
    return recommendations.get(status, "")


def analyze_weekly_volume(
    user_id: str,
    week_start: str,
    muscle_volumes: list[MuscleVolumeInput],
) -> VolumeAnalysisResponse:
    """
    Analyze weekly volume for all muscle groups and classify
    against MEV/MAV/MRV landmarks.
    """
    muscle_statuses: list[MuscleVolumeStatus] = []
    above_mrv_count = 0
    below_mev_count = 0

    for mv in muscle_volumes:
        landmarks = _get_landmarks(mv.muscle_group)
        mev = landmarks["mev"]
        mav = landmarks["mav"]
        mrv = landmarks["mrv"]

        status = _classify_status(mv.total_sets, mev, mav, mrv)
        rec    = _recommendation_for_status(status, mv.muscle_group, mv.total_sets, mev, mav, mrv)

        if status == "ABOVE_MRV":
            above_mrv_count += 1
        elif status == "BELOW_MEV":
            below_mev_count += 1

        muscle_statuses.append(MuscleVolumeStatus(
            muscle_group=mv.muscle_group,
            total_sets=mv.total_sets,
            status=status,
            mev=mev,
            mav=mav,
            mrv=mrv,
            recommendation=rec,
        ))

    # ── Overall fatigue assessment ────────────────────────────────────────────
    total_muscles = len(muscle_volumes)
    if total_muscles > 0:
        overloaded_ratio = above_mrv_count / total_muscles
    else:
        overloaded_ratio = 0

    if above_mrv_count >= 3 or overloaded_ratio >= 0.5:
        overall_fatigue = "CRITICAL"
    elif above_mrv_count >= 2 or overloaded_ratio >= 0.3:
        overall_fatigue = "HIGH"
    elif above_mrv_count >= 1:
        overall_fatigue = "MODERATE"
    else:
        overall_fatigue = "LOW"

    # ── Weekly summary message ────────────────────────────────────────────────
    summary = _build_weekly_summary(
        overall_fatigue, above_mrv_count, below_mev_count, total_muscles
    )

    return VolumeAnalysisResponse(
        user_id=user_id,
        week_start=week_start,
        muscle_statuses=muscle_statuses,
        overall_fatigue=overall_fatigue,
        weekly_summary=summary,
    )


def _build_weekly_summary(
    fatigue: str,
    above_mrv: int,
    below_mev: int,
    total: int,
) -> str:
    if fatigue == "CRITICAL":
        return (
            f"{above_mrv}/{total} muscle groups exceed MRV. "
            f"Consider a deload week to allow recovery."
        )
    elif fatigue == "HIGH":
        return (
            f"High training load detected. "
            f"{above_mrv} group(s) above MRV — reduce volume next week."
        )
    elif fatigue == "MODERATE":
        return (
            f"Good week! One muscle group is close to MRV. "
            f"Monitor recovery for the next session."
        )
    else:
        if below_mev > 0:
            return (
                f"Recovery looks good. "
                f"{below_mev} group(s) could use more volume to maximize growth."
            )
        return "Training load is optimal. Keep up the great work! 💪"