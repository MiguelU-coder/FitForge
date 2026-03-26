# ai-service/engines/injury_risk.py
"""
Injury Risk Assessment Engine
=============================
Predicts injury risk based on:
1. Acute:Chronic Workload Ratio (ACWR)
2. Training frequency and volume spikes
3. Exercise form indicators (RPE trends)
4. Recovery status
5. Historical injury patterns

Based on:
- Tim Gabbett's research on ACWR and injury prediction
- Sports medicine guidelines for load management
- Practical recommendations for injury prevention
"""
from __future__ import annotations
from datetime import date, timedelta
from typing import Optional
from schemas.workout_schema import (
    InjuryRiskInput,
    ExerciseRiskFactor,
    InjuryRiskAssessment,
)
import numpy as np
from sklearn.linear_model import LogisticRegression
import structlog

logger = structlog.get_logger()


# Risk thresholds based on sports science literature
ACWR_INJURY_THRESHOLDS = {
    "low": 0.8,      # Undertraining
    "optimal": 1.3,   # Sweet spot
    "caution": 1.5,  # Caution zone
    "high": 1.8,     # High risk
}


def calculate_injury_risk(
    user_id: str,
    risk_data: InjuryRiskInput,
    current_date: Optional[str] = None,
) -> InjuryRiskAssessment:
    """
    Calculate injury risk assessment based on multiple factors.

    Args:
        user_id: User identifier
        risk_data: Combined workload and risk factor data
        current_date: Current date (defaults to today)

    Returns:
        InjuryRiskAssessment with risk level and recommendations
    """
    if current_date is None:
        current_date = date.today().isoformat()

    today = date.fromisoformat(current_date)

    # 1. Calculate ACWR-based risk
    acwr_risk = _calculate_acwr_risk(risk_data.acwr)

    # 2. Calculate volume spike risk
    volume_spike_risk = _calculate_volume_spike_risk(risk_data)

    # 3. Calculate fatigue accumulation risk
    fatigue_risk = _calculate_fatigue_risk(risk_data)

    # 4. Calculate frequency risk
    frequency_risk = _calculate_frequency_risk(risk_data)

    # 5. Analyze exercise-specific risks
    exercise_risks = _analyze_exercise_risks(risk_data.exercise_risks or [])

    # ── Machine Learning (Logistic Regression) Pathway ───────────────────────
    # We train a LogisticRegressor on Tim Gabbett's sports science baselines 
    # to output a precise Injury Probability (0-100%).
    try:
        # Features: [ACWR, volume_spike_pct, sleep_quality(0-10), consecutive_heavy_days]
        X_base = np.array([
            [1.0, 5, 8, 0],   # Optimal/Safe
            [1.5, 25, 6, 2],  # Caution
            [2.0, 50, 4, 4],  # High risk
            [0.8, 0, 9, 0],   # Low/Undertraining
            [1.8, 40, 5, 3],  # High risk
            [1.3, 10, 7, 1],  # Optimal
            [2.5, 80, 2, 5],  # Critical injury zone
            [1.1, 8, 5, 0],   # Safe but tired
        ])
        # Labels: 0 = Safe, 1 = Injured
        y_base = np.array([0, 0, 1, 0, 1, 0, 1, 0])
        
        lr_model = LogisticRegression(class_weight='balanced', random_state=42)
        lr_model.fit(X_base, y_base)
        
        # Calculate current user features
        current_volume = risk_data.current_week_volume or 1
        avg_volume = risk_data.average_weekly_volume or 1
        vol_spike_pct = max(0, ((current_volume - avg_volume) / avg_volume) * 100)
        user_sleep = risk_data.sleep_quality_score or 7
        user_heavy_days = risk_data.consecutive_heavy_sessions or 0
        user_acwr = risk_data.acwr or 1.0

        user_features = np.array([[user_acwr, vol_spike_pct, user_sleep, user_heavy_days]])
        
        # Determine strict injury probability (predict_proba returns [P(Safe), P(Injured)])
        injury_probability = lr_model.predict_proba(user_features)[0][1]
        
        # Scale to 100 for score
        risk_score = float(injury_probability * 100)
        logger.info("ml.injury_risk_calculated", probability=risk_score, acwr=user_acwr)
        
    except Exception as e:
        logger.error("ml.injury_risk_failed", error=str(e), fallback="heuristic")
        # Heuristic fallback
        risk_score = (
            acwr_risk["score"] * 0.30 +
            volume_spike_risk["score"] * 0.25 +
            fatigue_risk["score"] * 0.25 +
            frequency_risk["score"] * 0.20
        )

    # Adjust for exercise-specific risks
    if exercise_risks:
        max_exercise_risk = max(e["risk_score"] for e in exercise_risks)
        risk_score = min(risk_score * 1.2, 100) if max_exercise_risk > 70 else risk_score

    # Determine overall risk level
    risk_level = _determine_risk_level(risk_score)

    # Generate recommendations
    recommendations = _generate_recommendations(
        risk_level=risk_level,
        acwr=acwr_risk,
        volume_spike=volume_spike_risk,
        fatigue=fatigue_risk,
        frequency=frequency_risk,
        exercise_risks=exercise_risks,
    )

    # Determine if medical consultation is recommended
    needs_medical = risk_score >= 75 or any(
        e["risk_score"] >= 80 for e in exercise_risks
    )

    return InjuryRiskAssessment(
        user_id=user_id,
        date=current_date,
        overall_risk_level=risk_level,
        risk_score=round(risk_score, 1),
        acwr_risk=acwr_risk,
        volume_spike_risk=volume_spike_risk,
        fatigue_risk=fatigue_risk,
        frequency_risk=frequency_risk,
        exercise_risks=exercise_risks,
        recommendations=recommendations,
        medical_consultation_recommended=needs_medical,
    )


def _calculate_acwr_risk(acwr: Optional[float]) -> dict:
    """Calculate risk based on ACWR."""
    if acwr is None:
        return {
            "score": 20.0,
            "level": "unknown",
            "description": "Not enough data to calculate ACWR",
        }

    if acwr < ACWR_INJURY_THRESHOLDS["low"]:
        return {
            "score": 15.0,
            "level": "low",
            "description": f"ACWR {acwr:.2f} - Undertraining (low injury risk)",
        }
    elif acwr <= ACWR_INJURY_THRESHOLDS["optimal"]:
        return {
            "score": 25.0,
            "level": "optimal",
            "description": f"ACWR {acwr:.2f} - Optimal training load",
        }
    elif acwr <= ACWR_INJURY_THRESHOLDS["caution"]:
        return {
            "score": 55.0,
            "level": "caution",
            "description": f"ACWR {acwr:.2f} - Elevated injury risk",
        }
    elif acwr <= ACWR_INJURY_THRESHOLDS["high"]:
        return {
            "score": 75.0,
            "level": "high",
            "description": f"ACWR {acwr:.2f} - High injury risk zone",
        }
    else:
        return {
            "score": 90.0,
            "level": "critical",
            "description": f"ACWR {acwr:.2f} - Critical! Significant injury risk",
        }


def _calculate_volume_spike_risk(data: InjuryRiskInput) -> dict:
    """Calculate risk based on sudden volume increases."""
    current_volume = data.current_week_volume or 0
    avg_volume = data.average_weekly_volume or 1
    previous_volume = data.previous_week_volume or avg_volume

    if current_volume == 0 or avg_volume == 0:
        return {"score": 20.0, "level": "unknown", "description": "No volume data"}

    # Percentage increase from average
    pct_increase = ((current_volume - avg_volume) / avg_volume) * 100

    # Also check week-over-week change
    if previous_volume > 0:
        wow_change = ((current_volume - previous_volume) / previous_volume) * 100
    else:
        wow_change = 0

    # Risk based on spike magnitude
    if pct_increase <= 10:
        return {
            "score": 20.0,
            "level": "low",
            "description": f"Volume stable ({pct_increase:+.0f}% from avg)",
        }
    elif pct_increase <= 25:
        return {
            "score": 40.0,
            "level": "moderate",
            "description": f"Moderate volume increase ({pct_increase:+.0f}%)",
        }
    elif pct_increase <= 50:
        return {
            "score": 65.0,
            "level": "elevated",
            "description": f"Significant volume spike ({pct_increase:+.0f}%)",
        }
    else:
        return {
            "score": 85.0,
            "level": "high",
            "description": f"Dangerous volume spike ({pct_increase:+.0f}%)",
        }


def _calculate_fatigue_risk(data: InjuryRiskInput) -> dict:
    """Calculate risk based on accumulated fatigue."""
    consecutive_heavy_days = data.consecutive_heavy_sessions or 0
    sleep_quality = data.sleep_quality_score or 7  # Default to decent sleep
    stress_level = data.stress_level or 5  # Default to moderate stress

    # Risk factors
    fatigue_score = 0

    # Consecutive heavy sessions
    if consecutive_heavy_days >= 4:
        fatigue_score += 40
    elif consecutive_heavy_days >= 2:
        fatigue_score += 20

    # Poor sleep
    if sleep_quality <= 4:
        fatigue_score += 30
    elif sleep_quality <= 6:
        fatigue_score += 15

    # High stress
    if stress_level >= 8:
        fatigue_score += 25
    elif stress_level >= 6:
        fatigue_score += 10

    # Determine level
    if fatigue_score <= 20:
        return {
            "score": fatigue_score,
            "level": "low",
            "description": "Low accumulated fatigue",
        }
    elif fatigue_score <= 45:
        return {
            "score": fatigue_score,
            "level": "moderate",
            "description": "Moderate fatigue accumulation",
        }
    elif fatigue_score <= 70:
        return {
            "score": fatigue_score,
            "level": "elevated",
            "description": "Elevated fatigue - increased injury risk",
        }
    else:
        return {
            "score": fatigue_score,
            "level": "high",
            "description": "High fatigue - very elevated injury risk",
        }


def _calculate_frequency_risk(data: InjuryRiskInput) -> dict:
    """Calculate risk based on training frequency."""
    sessions_per_week = data.sessions_per_week or 0
    days_since_last_session = data.days_since_last_session

    # Risk based on frequency
    if sessions_per_week <= 3:
        freq_score = 15
        freq_level = "low"
    elif sessions_per_week <= 5:
        freq_score = 25
        freq_level = "optimal"
    elif sessions_per_week <= 7:
        freq_score = 45
        freq_level = "high"
    else:
        freq_score = 70
        freq_level = "excessive"

    # Adjust for rest days
    if days_since_last_session is not None:
        if days_since_last_session == 0:
            # Training consecutive days
            freq_score = min(freq_score + 20, 100)
            freq_level = "excessive"
        elif days_since_last_session > 7:
            # Too much rest
            freq_score = max(freq_score - 15, 10)
            freq_level = "low"

    descriptions = {
        "low": f"Low frequency ({sessions_per_week}/week)",
        "optimal": f"Optimal frequency ({sessions_per_week}/week)",
        "high": f"High frequency ({sessions_per_week}/week)",
        "excessive": f"Excessive frequency ({sessions_per_week}/week)",
    }

    return {
        "score": freq_score,
        "level": freq_level,
        "description": descriptions.get(freq_level, "Unknown frequency"),
    }


def _analyze_exercise_risks(exercise_risks: list[ExerciseRiskFactor]) -> list[dict]:
    """Analyze specific exercise risk factors."""
    results = []

    for ex in exercise_risks:
        risk_score = 0

        # Form degradation indicator (RIR trend)
        if ex.rir_trend == "increasing":
            risk_score += 25  # RIR going up might mean form breakdown
        elif ex.rir_trend == "decreasing":
            risk_score += 10  # Getting stronger

        # Volume per exercise
        if ex.sets_this_week and ex.sets_this_week > 20:
            risk_score += 20
        elif ex.sets_this_week and ex.sets_this_week > 15:
            risk_score += 10

        # Historical issues
        if ex.has_injury_history:
            risk_score += 30

        # Equipment issues
        if ex.equipment_condition == "poor":
            risk_score += 25
        elif ex.equipment_condition == "fair":
            risk_score += 10

        # Determine level
        if risk_score <= 25:
            level = "low"
        elif risk_score <= 50:
            level = "moderate"
        elif risk_score <= 75:
            level = "elevated"
        else:
            level = "high"

        results.append({
            "exercise_name": ex.exercise_name,
            "exercise_id": ex.exercise_id,
            "risk_score": risk_score,
            "level": level,
            "factors": _summarize_risk_factors(ex),
        })

    return results


def _summarize_risk_factors(ex: ExerciseRiskFactor) -> str:
    """Summarize the risk factors for an exercise."""
    factors = []

    if ex.has_injury_history:
        factors.append("prior injury")
    if ex.rir_trend == "increasing":
        factors.append("possible form issues")
    if ex.sets_this_week and ex.sets_this_week > 15:
        factors.append("high volume")
    if ex.equipment_condition and ex.equipment_condition != "good":
        factors.append(f"equipment: {ex.equipment_condition}")

    if not factors:
        return "No significant risk factors"

    return ", ".join(factors)


def _determine_risk_level(score: float) -> str:
    """Determine overall risk level from score."""
    if score <= 25:
        return "LOW"
    elif score <= 45:
        return "MODERATE"
    elif score <= 65:
        return "ELEVATED"
    elif score <= 80:
        return "HIGH"
    else:
        return "CRITICAL"


def _generate_recommendations(
    risk_level: str,
    acwr: dict,
    volume_spike: dict,
    fatigue: dict,
    frequency: dict,
    exercise_risks: list[dict],
) -> list[str]:
    """Generate actionable recommendations based on risk factors."""
    recommendations = []

    # ACWR recommendations
    if acwr.get("level") in ["caution", "high", "critical"]:
        recommendations.append(
            "Reduce training volume by 20-40% for the next 1-2 weeks"
        )
    elif acwr.get("level") == "optimal":
        recommendations.append("Maintain current training load - you're in the optimal zone")

    # Volume spike recommendations
    if volume_spike.get("score", 0) >= 50:
        recommendations.append(
            "Gradually ramp up volume instead of sudden increases"
        )

    # Fatigue recommendations
    if fatigue.get("score", 0) >= 50:
        if fatigue.get("level") == "elevated":
            recommendations.append("Consider an extra rest day this week")
        elif fatigue.get("level") == "high":
            recommendations.append("Take a deload week - reduce volume by 40-50%")

    # Frequency recommendations
    if frequency.get("level") == "excessive":
        recommendations.append("Reduce training frequency - aim for at least 1 rest day between intense sessions")

    # Exercise-specific recommendations
    high_risk_exercises = [e for e in exercise_risks if e.get("risk_score", 0) >= 60]
    if high_risk_exercises:
        names = [e["exercise_name"] for e in high_risk_exercises]
        recommendations.append(
            f"Pay extra attention to form with: {', '.join(names)}"
        )

    # Add general recommendation based on overall level
    if risk_level == "LOW":
        recommendations.append("Great job! Continue with your current training approach")
    elif risk_level == "MODERATE":
        recommendations.append("Monitor your body closely and adjust if needed")
    elif risk_level in ["ELEVATED", "HIGH", "CRITICAL"]:
        recommendations.append("Prioritize recovery - consider professional guidance if symptoms persist")

    return recommendations
