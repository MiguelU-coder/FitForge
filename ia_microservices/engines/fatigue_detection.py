# ai-service/engines/fatigue_detection.py
"""
Fatigue Detection Engine
=========================
Detects accumulated fatigue using:
1. Acute:Chronic Workload Ratio (ACWR) — sports science standard
2. RPE trend analysis
3. Session frequency & duration

ACWR:
- Acute load = last 7 days average daily load
- Chronic load = last 28 days average daily load
- ACWR = Acute / Chronic
  - < 0.8  → Undertraining (too little load)
  - 0.8–1.3 → Optimal sweet spot
  - 1.3–1.5 → Caution zone
  - > 1.5   → High injury risk / overreaching
"""
from __future__ import annotations
import statistics
from datetime import date, timedelta
from schemas.workout_schema import SessionLoad, FatigueAssessment


def _compute_load(session: SessionLoad) -> float:
    """
    Compute training load score for a session.
    Uses session RPE × volume if available, else raw volume.
    """
    volume = session.total_volume_kg or 0
    sets   = session.total_sets or 0
    rpe    = session.rpe_avg or 7  # default RPE if not provided

    # Session RPE × sets (sRPE method — Foster 2001)
    session_load = rpe * sets

    # Add volume modifier (normalized per 1000kg)
    volume_modifier = (volume / 1000) * 10

    return session_load + volume_modifier


def detect_fatigue(
    user_id: str,
    sessions: list[SessionLoad],
) -> FatigueAssessment:
    """
    Assess accumulated fatigue using ACWR and trend analysis.
    """
    if not sessions:
        return FatigueAssessment(
            user_id=user_id,
            fatigue_level="RECOVERED",
            score=0.0,
            recommendation="No recent training data. Start fresh!",
        )

    # Parse dates and compute loads
    today = date.today()

    # Build a dict of {date_str: load}
    load_by_date: dict[str, float] = {}
    for s in sessions:
        try:
            load_by_date[s.date] = _compute_load(s)
        except Exception:
            continue

    # Acute load: last 7 days
    acute_loads = []
    for i in range(7):
        d = (today - timedelta(days=i)).isoformat()
        acute_loads.append(load_by_date.get(d, 0))

    # Chronic load: last 28 days
    chronic_loads = []
    for i in range(28):
        d = (today - timedelta(days=i)).isoformat()
        chronic_loads.append(load_by_date.get(d, 0))

    acute_avg   = statistics.mean(acute_loads)
    chronic_avg = statistics.mean(chronic_loads) if any(chronic_loads) else 1

    # ACWR
    acwr = acute_avg / chronic_avg if chronic_avg > 0 else 0

    # RPE trend (is RPE going up over recent sessions?)
    recent_sessions = sorted(sessions, key=lambda s: s.date, reverse=True)[:7]
    rpe_values = [s.rpe_avg for s in recent_sessions if s.rpe_avg is not None]
    rpe_trend  = "stable"

    if len(rpe_values) >= 3:
        # Simple linear trend: is average RPE increasing?
        first_half  = statistics.mean(rpe_values[len(rpe_values)//2:])
        second_half = statistics.mean(rpe_values[:len(rpe_values)//2])
        if second_half > first_half + 0.5:
            rpe_trend = "increasing"
        elif second_half < first_half - 0.5:
            rpe_trend = "decreasing"

    # Session frequency last 7 days
    sessions_this_week = sum(1 for s in sessions if s.date >= (today - timedelta(days=7)).isoformat())

    # ── Fatigue classification ────────────────────────────────────────────────
    fatigue_level, score, recommendation, days_to_deload = _classify_fatigue(
        acwr=acwr,
        rpe_trend=rpe_trend,
        sessions_this_week=sessions_this_week,
    )

    return FatigueAssessment(
        user_id=user_id,
        fatigue_level=fatigue_level,
        score=round(score, 1),
        recommendation=recommendation,
        days_to_deload=days_to_deload,
    )


def _classify_fatigue(
    acwr: float,
    rpe_trend: str,
    sessions_this_week: int,
) -> tuple[str, float, str, int | None]:
    """
    Returns (level, score 0-10, recommendation, days_to_deload).
    """
    # Base score from ACWR
    if acwr < 0.6:
        base_score = 1.0
        level      = "RECOVERED"
    elif acwr < 0.8:
        base_score = 2.0
        level      = "RECOVERED"
    elif acwr <= 1.3:
        base_score = 4.0
        level      = "NORMAL"
    elif acwr <= 1.5:
        base_score = 6.5
        level      = "ACCUMULATED"
    else:
        base_score = 8.5
        level      = "OVERREACHED"

    # RPE modifier
    if rpe_trend == "increasing":
        base_score = min(base_score + 1.5, 10)
    elif rpe_trend == "decreasing":
        base_score = max(base_score - 0.5, 0)

    # High frequency modifier
    if sessions_this_week >= 6:
        base_score = min(base_score + 1.0, 10)

    # Final classification
    if base_score >= 8:
        level = "OVERREACHED"
    elif base_score >= 6:
        level = "ACCUMULATED"
    elif base_score >= 3:
        level = "NORMAL"
    else:
        level = "RECOVERED"

    # Recommendations
    rec_map = {
        "RECOVERED": (
            f"You're well recovered (ACWR {acwr:.2f}). "
            f"Good time to push intensity. Train hard! 🔥"
        ),
        "NORMAL": (
            f"Training load is in the optimal zone (ACWR {acwr:.2f}). "
            f"Keep the current volume and intensity."
        ),
        "ACCUMULATED": (
            f"Fatigue is accumulating (ACWR {acwr:.2f}). "
            f"Consider reducing volume by 20-30% for 3-4 days."
        ),
        "OVERREACHED": (
            f"High overreaching detected (ACWR {acwr:.2f}). "
            f"Take a deload week: reduce volume 40-50% and intensity 10-15%."
        ),
    }

    days_map = {
        "RECOVERED":   None,
        "NORMAL":      None,
        "ACCUMULATED": 3,
        "OVERREACHED": 7,
    }

    return level, base_score, rec_map[level], days_map[level]