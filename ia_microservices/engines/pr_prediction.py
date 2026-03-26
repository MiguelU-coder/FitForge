# ai-service/engines/pr_prediction.py
"""
PR (Personal Record) Prediction Engine
====================================
Predicts when a user is likely to hit a new PR based on:
1. Current strength progression rate
2. Training age / experience level
3. Consistency of progressive overload
4. Proximity to previous PRs
5. Historical PR frequency

Based on:
- Linear progression models for beginners
- Non-linear models for intermediate/advanced
- Strength curves research
- Practical strength training periodization
"""
from __future__ import annotations
from datetime import date, timedelta
from typing import Optional
from schemas.workout_schema import (
    PRHistoryEntry,
    PRPredictionRequest,
    PRPrediction,
    Estimated1RM,
)


# Typical strength gains by training age (months)
# These are conservative estimates for natural lifters
STRENGTH_GAINS_BY_EXPERIENCE = {
    (0, 3): 0.10,    # 10% per month for beginners
    (3, 6): 0.06,    # 6% per month for early intermediate
    (6, 12): 0.04,   # 4% per month for intermediate
    (12, 24): 0.025, # 2.5% per month for advanced
    (24, float("inf")): 0.015,  # 1.5% per month for very advanced
}


# Typical PR frequency by experience level (days between PRs)
PR_FREQUENCY_BY_EXPERIENCE = {
    "beginner": 14,      # PR every ~2 weeks
    "early_intermediate": 30,   # PR every ~1 month
    "intermediate": 60,         # PR every ~2 months
    "advanced": 120,            # PR every ~4 months
    "elite": 180,              # PR every ~6 months
}


# Weight increment thresholds (kg) - minimum change to count as PR attempt
MIN_WEIGHT_INCREMENTS = {
    "BARBELL": 2.5,
    "DUMBBELL": 1.0,
    "CABLE": 2.5,
    "MACHINE": 5.0,
    "BODYWEIGHT": 0.0,
}


def _estimate_training_age(months_training: Optional[int], pr_history: list[PRHistoryEntry]) -> str:
    """Estimate training age/level based on experience."""
    if months_training:
        if months_training < 3:
            return "beginner"
        elif months_training < 6:
            return "early_intermediate"
        elif months_training < 12:
            return "intermediate"
        elif months_training < 24:
            return "advanced"
        else:
            return "elite"

    # Estimate from PR history frequency
    if len(pr_history) < 3:
        return "beginner"
    elif len(pr_history) < 10:
        return "early_intermediate"
    elif len(pr_history) < 25:
        return "intermediate"
    elif len(pr_history) < 50:
        return "advanced"
    else:
        return "elite"


def _calculate_progression_rate(history: list[PRHistoryEntry]) -> float:
    """Calculate average weekly weight progression rate."""
    if len(history) < 2:
        return 0.0

    # Sort by date
    sorted_history = sorted(history, key=lambda x: x.date)
    oldest = sorted_history[0]
    newest = sorted_history[-1]

    try:
        oldest_date = date.fromisoformat(oldest.date)
        newest_date = date.fromisoformat(newest.date)
    except (ValueError, TypeError):
        return 0.0

    days_diff = (newest_date - oldest_date).days
    if days_diff <= 0:
        return 0.0

    weeks = days_diff / 7
    if weeks <= 0:
        return 0.0

    weight_diff = (newest.weight_kg or 0) - (oldest.weight_kg or 0)
    return weight_diff / weeks  # kg per week


def _estimate_1rm(weight: float, reps: int, rir: int = 0) -> float:
    """Estimate 1RM using Epley formula with RIR adjustment."""
    if reps <= 0 or weight <= 0:
        return 0.0

    # Effective reps including RIR
    effective_reps = reps + rir

    # Epley formula
    if effective_reps == 1:
        return weight
    else:
        return weight * (1 + effective_reps / 30)


def _predict_1rm_at_date(
    current_1rm: float,
    progression_rate: float,
    days_ahead: int,
) -> float:
    """Predict 1RM at a future date based on progression rate."""
    weeks_ahead = days_ahead / 7
    predicted_1rm = current_1rm + (progression_rate * weeks_ahead)
    return predicted_1rm


def _calculate_days_to_pr(
    current_weight: float,
    current_reps: int,
    current_rir: int,
    progression_rate: float,
    target_weight: float,
    equipment: Optional[str] = None,
) -> Optional[int]:
    """Calculate estimated days until PR at target weight."""
    # Calculate current estimated 1RM
    current_1rm = _estimate_1rm(current_weight, current_reps, current_rir)

    if current_1rm <= 0 or progression_rate <= 0:
        return None

    # Calculate weight needed to beat
    min_increment = MIN_WEIGHT_INCREMENTS.get(equipment, 2.5) if equipment else 2.5
    pr_threshold = target_weight + min_increment

    # Calculate days needed
    weight_needed = pr_threshold - current_1rm

    if weight_needed <= 0:
        return 0  # Already can lift it

    # Use weekly progression rate
    days_needed = (weight_needed / progression_rate) * 7

    return max(0, int(days_needed))


def predict_pr(
    user_id: str,
    request: PRPredictionRequest,
    current_date: Optional[str] = None,
) -> PRPrediction:
    """
    Predict PR likelihood and timeline for an exercise.

    Args:
        user_id: User identifier
        request: PR prediction request with exercise history
        current_date: Current date (defaults to today)

    Returns:
        PRPrediction with timeline and confidence
    """
    if current_date is None:
        current_date = date.today().isoformat()

    today = date.fromisoformat(current_date)

    # Get current performance from most recent session
    current_performance = request.current_performance
    if not current_performance or not current_performance.weight_kg:
        return PRPrediction(
            user_id=user_id,
            exercise_id=request.exercise_id,
            exercise_name=request.exercise_name,
            pr_probability=0.0,
            days_estimate=None,
            confidence=0.0,
            reasoning="No current performance data available",
            recommendation="Log a set to get PR predictions",
            target_weights={},
        )

    # Determine equipment for increment calculation
    equipment = request.equipment.value if request.equipment else None

    # Calculate progression rate from history
    progression_rate = _calculate_progression_rate(request.pr_history)

    # If no history, estimate based on training age
    if progression_rate == 0 and request.months_training:
        # Use typical progression rates by experience
        level = _estimate_training_age(request.months_training, request.pr_history or [])
        typical_rate = _get_typical_progression_rate(level, request.exercise_type)
        progression_rate = typical_rate

    # Get PR history details
    current_pr = _get_current_pr(request.pr_history)
    pr_history_count = len(request.pr_history or [])

    # Estimate training level
    training_level = _estimate_training_age(request.months_training, request.pr_history or [])

    # Calculate probability of PR in different timeframes
    current_1rm = _estimate_1rm(
        current_performance.weight_kg,
        current_performance.reps or 8,
        current_performance.rir or 2,
    )

    probability_30_days = _calculate_pr_probability(
        current_1rm=current_1rm,
        target_1rm=current_pr.estimated_1rm if current_pr else current_1rm * 1.05,
        progression_rate=progression_rate,
        days_estimate=30,
    )

    probability_90_days = _calculate_pr_probability(
        current_1rm=current_1rm,
        target_1rm=current_pr.estimated_1rm if current_pr else current_1rm * 1.05,
        progression_rate=progression_rate,
        days_estimate=90,
    )

    probability_180_days = _calculate_pr_probability(
        current_1rm=current_1rm,
        target_1rm=current_pr.estimated_1rm if current_pr else current_1rm * 1.05,
        progression_rate=progression_rate,
        days_estimate=180,
    )

    # Calculate days to milestone weights
    target_weights = {}
    if current_pr:
        for name, percentage in [("5% milestone", 1.05), ("10% milestone", 1.10), ("New PR", 1.0)]:
            target = current_pr.estimated_1rm * percentage
            if progression_rate > 0:
                days = _calculate_days_to_pr(
                    current_weight=current_performance.weight_kg,
                    current_reps=current_performance.reps or 8,
                    current_rir=current_performance.rir or 2,
                    progression_rate=progression_rate,
                    target_weight=target,
                    equipment=equipment,
                )
                if days is not None:
                    target_weights[name] = {
                        "target_weight_kg": round(target, 1),
                        "estimated_days": days,
                    }

    # Determine confidence based on data quality
    confidence = _calculate_confidence(
        has_history=len(request.pr_history or []) > 0,
        has_multiple_sessions=len(request.pr_history or []) >= 3,
        progression_rate=progression_rate,
        training_level=training_level,
    )

    # Generate reasoning
    reasoning = _generate_reasoning(
        training_level=training_level,
        progression_rate=progression_rate,
        pr_history_count=pr_history_count,
        current_1rm=current_1rm,
        current_pr_1rm=current_pr.estimated_1rm if current_pr else None,
    )

    # Generate recommendation
    recommendation = _generate_pr_recommendation(
        probability_30_days=probability_30_days,
        training_level=training_level,
        progression_rate=progression_rate,
    )

    return PRPrediction(
        user_id=user_id,
        exercise_id=request.exercise_id,
        exercise_name=request.exercise_name,
        current_estimated_1rm=round(current_1rm, 1),
        current_pr_weight=current_pr.weight_kg if current_pr else None,
        current_pr_1rm=round(current_pr.estimated_1rm, 1) if current_pr else None,
        training_level=training_level,
        progression_rate_kg_per_week=round(progression_rate, 2) if progression_rate > 0 else None,
        pr_probability_30_days=probability_30_days,
        pr_probability_90_days=probability_90_days,
        pr_probability_180_days=probability_180_days,
        days_estimate=target_weights.get("New PR", {}).get("estimated_days"),
        confidence=confidence,
        reasoning=reasoning,
        recommendation=recommendation,
        target_weights=target_weights,
    )


def _get_current_pr(pr_history: list[PRHistoryEntry]) -> Optional[dict]:
    """Get the current PR from history."""
    if not pr_history:
        return None

    # Get highest weight PR
    valid_prs = [pr for pr in pr_history if pr.weight_kg]
    if not valid_prs:
        return None

    best = max(valid_prs, key=lambda x: x.weight_kg or 0)

    return {
        "weight_kg": best.weight_kg,
        "estimated_1rm": _estimate_1rm(best.weight_kg, best.reps or 1, 0),
        "date": best.date,
    }


def _get_typical_progression_rate(level: str, exercise_type: Optional[str]) -> float:
    """Get typical progression rate by training level and exercise type."""
    # Base rates (kg/week) for compound movements
    base_rates = {
        "beginner": 2.5,
        "early_intermediate": 1.5,
        "intermediate": 0.75,
        "advanced": 0.4,
        "elite": 0.2,
    }

    rate = base_rates.get(level, 1.0)

    # Adjust for isolation exercises
    if exercise_type == "isolation":
        rate *= 0.5

    return rate


def _calculate_pr_probability(
    current_1rm: float,
    target_1rm: float,
    progression_rate: float,
    days_estimate: int,
) -> float:
    """Calculate probability (0-100) of hitting PR in given timeframe."""
    if progression_rate <= 0:
        # No clear progression - lower probability
        if current_1rm >= target_1rm:
            return 75.0
        return 15.0

    # Calculate predicted 1RM at timeframe
    predicted_1rm = _predict_1rm_at_date(current_1rm, progression_rate, days_estimate)

    # Calculate how much we expect to gain vs target
    gain_needed = target_1rm - current_1rm
    gain_predicted = predicted_1rm - current_1rm

    if gain_needed <= 0:
        return 95.0  # Already exceeded

    if gain_predicted <= 0:
        return 10.0  # Not expecting progress

    # Probability based on how much of the gap we'll close
    ratio = gain_predicted / gain_needed

    # Scale to probability (cap at reasonable max)
    probability = min(ratio * 80, 90)

    # Add some base probability for consistent training
    if ratio >= 0.5:
        probability = max(probability, 30)

    return round(probability, 1)


def _calculate_confidence(
    has_history: bool,
    has_multiple_sessions: bool,
    progression_rate: float,
    training_level: str,
) -> float:
    """Calculate confidence level (0-1) for predictions."""
    score = 0.3  # Base confidence

    if has_history:
        score += 0.2

    if has_multiple_sessions:
        score += 0.2

    if progression_rate > 0:
        score += 0.15

    # Lower confidence for advanced+ (harder to predict)
    if training_level in ["advanced", "elite"]:
        score -= 0.1

    return round(max(0.1, min(0.9, score)), 2)


def _generate_reasoning(
    training_level: str,
    progression_rate: float,
    pr_history_count: int,
    current_1rm: float,
    current_pr_1rm: Optional[float],
) -> str:
    """Generate human-readable reasoning for the prediction."""
    level_names = {
        "beginner": "beginner",
        "early_intermediate": "early intermediate",
        "intermediate": "intermediate",
        "advanced": "advanced",
        "elite": "elite",
    }

    level = level_names.get(training_level, "unknown")

    parts = [
        f"You're classified as a {level} lifter based on training history.",
    ]

    if progression_rate > 0:
        parts.append(
            f"Current progression rate is {progression_rate:.2f} kg/week."
        )
    else:
        parts.append("Not enough data to determine progression rate.")

    if pr_history_count > 0:
        parts.append(f"You have {pr_history_count} recorded PRs.")

    if current_pr_1rm:
        gap = ((current_1rm - current_pr_1rm) / current_pr_1rm) * 100
        if gap > 0:
            parts.append(f"You're currently training at {gap:.1f}% above your current PR weight.")
        else:
            parts.append("Your current performance is below your PR - great opportunity!")

    return " ".join(parts)


def _generate_pr_recommendation(
    probability_30_days: float,
    training_level: str,
    progression_rate: float,
) -> str:
    """Generate recommendation for hitting a PR."""
    if probability_30_days >= 70:
        return "You're in a great spot to hit a PR soon! Focus on optimal recovery and peak performance."
    elif probability_30_days >= 40:
        if progression_rate > 0:
            return "Keep consistent with progressive overload. A PR is within reach in the next few weeks."
        else:
            return "Focus on consistent progressive overload to set yourself up for a PR."
    elif probability_30_days >= 20:
        return "Build a solid foundation first. Focus on technique and consistent training for the next few weeks."
    else:
        if training_level in ["advanced", "elite"]:
            return "At your level, PRs take time. Focus on periodization and peak for a specific date."
        else:
            return "Keep training consistently. Your strength will build over time."
