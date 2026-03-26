# ai-service/engines/progressive_overload.py
"""
Progressive Overload Engine
============================
Implements evidence-based progressive overload logic inspired by:
- Mike Israetel's RIR-based progression
- Stronger by Science load management
- NSCA guidelines on periodization

Decision tree:
1. If avg RIR of last session > target_rir + 1 → INCREASE WEIGHT
2. If avg RIR ≈ target_rir (±1) and reps hit → MAINTAIN (good session)
3. If avg RIR < target_rir - 1 → too heavy → DELOAD or DECREASE
4. If reps consistently below target → adjust reps before weight
5. If stagnant for 3+ sessions → flag for program change
"""
from __future__ import annotations
import statistics
from schemas.workout_schema import (
    ExerciseHistoryEntry,
    SetInput,
    SetType,
    ProgressionRecommendation,
    WorkoutSuggestion,
)
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from engines.ml.dataset_builder import build_progression_dataset
from engines.ml.anomaly_detector import filter_anomalous_sets
import structlog

logger = structlog.get_logger()


# ── Volume landmarks per equipment (sets × reps guide) ────────────────────────
# Based on typical gym equipment increments
WEIGHT_INCREMENTS = {
    "BARBELL":     2.5,
    "DUMBBELL":    1.0,
    "CABLE":       2.5,
    "MACHINE":     5.0,
    "KETTLEBELL":  4.0,
    "BODYWEIGHT":  0.0,
}


def _get_working_sets(sets: list[SetInput]) -> list[SetInput]:
    """Filter to working sets only (exclude warmup, drop sets)."""
    return [s for s in sets if s.set_type == SetType.WORKING and s.weight_kg and s.reps]


def _avg_rir(sets: list[SetInput]) -> Optional[float]:
    """Average RIR of working sets. Returns None if no RIR data."""
    rirs = [s.rir for s in sets if s.rir is not None]
    return statistics.mean(rirs) if rirs else None


def _avg_weight(sets: list[SetInput]) -> Optional[float]:
    """Average weight across working sets."""
    weights = [s.weight_kg for s in sets if s.weight_kg is not None]
    return statistics.mean(weights) if weights else None


def _avg_reps(sets: list[SetInput]) -> Optional[float]:
    """Average reps across working sets."""
    reps_list = [s.reps for s in sets if s.reps is not None]
    return statistics.mean(reps_list) if reps_list else None


def _top_set_weight(sets: list[SetInput]) -> Optional[float]:
    """Heaviest working set weight."""
    weights = [s.weight_kg for s in sets if s.weight_kg is not None]
    return max(weights) if weights else None


def _estimated_1rm(weight_kg: float, reps: int, rir: int = 0) -> float:
    """
    Epley formula modified for RIR:
    e1RM = weight × (1 + (reps + rir) / 30)
    """
    effective_reps = reps + rir
    return weight_kg * (1 + effective_reps / 30)


def calculate_progression(
    history: list[ExerciseHistoryEntry],
    target_reps: int,
    target_rir: int,
    weight_increment: float,
    exercise_name: str,
    exercise_id: str,
    equipment: Optional[str] = None,
) -> ProgressionRecommendation:
    """
    Core progressive overload calculation.
    Returns a recommendation based on the last N sessions.
    """
    # Use equipment-specific increment if available
    if equipment and equipment in WEIGHT_INCREMENTS:
        increment = WEIGHT_INCREMENTS[equipment]
        if increment > 0:
            weight_increment = increment

    # Get sessions newest → oldest
    sessions = sorted(history, key=lambda x: x.session_date, reverse=True)

    # Need at least 1 session
    if not sessions:
        return ProgressionRecommendation(
            exercise_id=exercise_id,
            exercise_name=exercise_name,
            action="MAINTAIN",
            confidence=0.3,
            reasoning="No history available — start with a comfortable weight.",
            display_message="No prior data — start at a comfortable weight 🏋️",
        )

    # ── Last session analysis ─────────────────────────────────────────────────
    last_session = sessions[0]
    last_working = _get_working_sets(last_session.sets)

    if not last_working:
        return ProgressionRecommendation(
            exercise_id=exercise_id,
            exercise_name=exercise_name,
            action="MAINTAIN",
            confidence=0.4,
            reasoning="Last session had no working sets to analyze.",
            display_message="Add working sets to get AI suggestions 💡",
        )

    last_avg_rir    = _avg_rir(last_working)
    last_avg_weight = _avg_weight(last_working)
    last_avg_reps   = _avg_reps(last_working)
    last_top_weight = _top_set_weight(last_working)

    # ── Multi-session trend analysis ─────────────────────────────────────────
    stagnation_sessions = 0
    recent_weights = []

    for session in sessions[:5]:
        working = _get_working_sets(session.sets)
        if working:
            top_w = _top_set_weight(working)
            if top_w:
                recent_weights.append(top_w)

    # Detect stagnation: weight hasn't changed in 3+ sessions
    if len(recent_weights) >= 3:
        if max(recent_weights[:3]) == min(recent_weights[:3]):
            stagnation_sessions = 3
        elif len(recent_weights) >= 4 and max(recent_weights[:4]) == min(recent_weights[:4]):
            stagnation_sessions = 4

    # ── Machine Learning (RandomForest) Path ──────────────────────────────────
    
    # Try to build dataset and filter anomalies
    X, y = build_progression_dataset(history)
    X_clean, y_clean = filter_anomalous_sets(X, y)
    
    # We require at least 5 working sets historically to train a reliable model
    use_ml = len(X_clean) >= 5 and last_top_weight is not None
    
    if use_ml:
        try:
            # Train an instant RandomForest strictly on the user's localized history
            rf = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
            rf.fit(X_clean, y_clean)
            
            next_session_idx = int(np.max(X_clean[:, 0])) + 1
            
            # Predict RIR for a range of candidate weights (from -5kg to +10kg from last top weight)
            # using the equipment's minimum increment
            candidate_weights = np.arange(
                max(0, last_top_weight - (weight_increment * 4)), 
                last_top_weight + (weight_increment * 6), 
                weight_increment
            )
            
            best_weight = last_top_weight
            best_rir_diff = float('inf')
            predicted_rir_at_best = target_rir
            
            for cw in candidate_weights:
                # Predict RIR for the next session, set 1, candidate weight, and user's target reps
                pred_rir = rf.predict([[next_session_idx, 1, cw, target_reps]])[0]
                
                # We want a weight that exactly matches or slightly exceeds the target_rir
                rir_diff = abs(pred_rir - target_rir)
                if rir_diff < best_rir_diff and pred_rir >= (target_rir - 0.5):
                    best_rir_diff = rir_diff
                    best_weight = round(cw, 2)
                    predicted_rir_at_best = pred_rir
                    
            logger.info("ml.progression_computed", 
                        exercise_id=exercise_id, 
                        sets_trained_on=len(X_clean), 
                        best_weight=best_weight, 
                        pred_rir=predicted_rir_at_best)

            action = "MAINTAIN" 
            if best_weight > last_top_weight:
                action = "INCREASE_WEIGHT"
            elif best_weight < last_top_weight:
                action = "DELOAD"

            confidence = min(0.95, 0.5 + (len(X_clean) * 0.05)) # Confidence scales with data
            
            reasoning = (
                f"ML Predicted outcome: Lifting {best_weight}kg for {target_reps} reps "
                f"will leave you with ~{predicted_rir_at_best:.1f} RIR. "
                f"(Trained on your last {len(X_clean)} sets)."
            )
            
            display_message = _build_display_message(action, best_weight, target_reps, target_rir, exercise_name)
            
            return ProgressionRecommendation(
                exercise_id=exercise_id,
                exercise_name=exercise_name,
                action=action,
                suggested_weight_kg=float(best_weight),
                suggested_reps=target_reps,
                suggested_rir=target_rir,
                confidence=round(confidence, 2),
                reasoning=reasoning,
                display_message=display_message,
            )
            
        except Exception as e:
            logger.error("ml.progression_failed", error=str(e), fallback="heuristics")
            # If ML fails for any numerical reason, fallback to heuristics naturally

    # ── Heuristic Fallback (If not enough ML data) ────────────────────────────

    # ── Decision logic ────────────────────────────────────────────────────────

    suggested_weight = last_top_weight
    action           = "MAINTAIN"
    confidence       = 0.7
    reasoning_parts  = []

    # Case 1: RIR data available → primary decision
    if last_avg_rir is not None:
        rir_surplus = last_avg_rir - target_rir

        if rir_surplus >= 2:
            # Significantly more in the tank than target → increase weight
            action           = "INCREASE_WEIGHT"
            suggested_weight = round((last_top_weight or 0) + weight_increment, 2)
            confidence       = 0.85
            reasoning_parts.append(
                f"Avg RIR was {last_avg_rir:.1f}, target is {target_rir}. "
                f"You have {rir_surplus:.1f} reps spare — ready to progress."
            )

        elif rir_surplus >= 1:
            # Slightly above target → conservative increase
            action           = "INCREASE_WEIGHT"
            suggested_weight = round((last_top_weight or 0) + weight_increment, 2)
            confidence       = 0.70
            reasoning_parts.append(
                f"Avg RIR {last_avg_rir:.1f} is slightly above target {target_rir}. "
                f"Small weight increase recommended."
            )

        elif -1 <= rir_surplus < 1:
            # On target → maintain
            action     = "MAINTAIN"
            confidence = 0.80
            reasoning_parts.append(
                f"Avg RIR {last_avg_rir:.1f} is on target. Maintain weight and focus on quality."
            )

        else:
            # RIR below target → too heavy
            action           = "DELOAD"
            suggested_weight = round((last_top_weight or 0) - weight_increment, 2)
            confidence       = 0.75
            reasoning_parts.append(
                f"Avg RIR {last_avg_rir:.1f} is below target {target_rir}. "
                f"Weight may be too heavy — consider reducing slightly."
            )

    # Case 2: No RIR data → use reps
    elif last_avg_reps is not None:
        if last_avg_reps >= target_reps + 2:
            action           = "INCREASE_WEIGHT"
            suggested_weight = round((last_top_weight or 0) + weight_increment, 2)
            confidence       = 0.65
            reasoning_parts.append(
                f"Averaged {last_avg_reps:.0f} reps vs target {target_reps}. "
                f"Comfortably above target — increase load."
            )
        elif last_avg_reps < target_reps - 2:
            action           = "DELOAD"
            suggested_weight = round((last_top_weight or 0) - weight_increment, 2)
            confidence       = 0.60
            reasoning_parts.append(
                f"Averaged {last_avg_reps:.0f} reps vs target {target_reps}. "
                f"Below target — reduce weight or check form."
            )
        else:
            action     = "MAINTAIN"
            confidence = 0.65
            reasoning_parts.append(
                f"Averaged {last_avg_reps:.0f} reps — close to target {target_reps}."
            )
    else:
        reasoning_parts.append("No RIR or reps data — log sets with RIR for better recommendations.")
        confidence = 0.3

    # Override: stagnation detection
    if stagnation_sessions >= 3 and action == "MAINTAIN":
        action     = "CHANGE_REPS"
        confidence = 0.75
        reasoning_parts.append(
            f"Weight has been the same for {stagnation_sessions} sessions. "
            f"Try adding a rep or changing set structure."
        )

    # ── Build display message ─────────────────────────────────────────────────
    display_message = _build_display_message(
        action, suggested_weight, target_reps, target_rir, exercise_name
    )

    return ProgressionRecommendation(
        exercise_id=exercise_id,
        exercise_name=exercise_name,
        action=action,
        suggested_weight_kg=suggested_weight,
        suggested_reps=target_reps,
        suggested_rir=target_rir,
        confidence=round(confidence, 2),
        reasoning=" ".join(reasoning_parts),
        display_message=display_message,
    )


def calculate_next_set_suggestion(
    sets_done_today: list[SetInput],
    last_session_sets: list[SetInput],
    exercise_id: str,
    target_reps: int,
    target_rir: int,
    weight_increment: float = 2.5,
) -> WorkoutSuggestion:
    """
    Real-time suggestion for the NEXT set in the current workout.
    Called after each set is logged.
    """
    today_working = _get_working_sets(sets_done_today)
    last_working  = _get_working_sets(last_session_sets) if last_session_sets else []

    # If we have sets done today → base suggestion on today's performance
    if today_working:
        last_set   = today_working[-1]
        last_rir   = last_set.rir
        last_w     = last_set.weight_kg or 0
        last_reps  = last_set.reps or 0

        # Same weight if performing well
        suggested_weight = last_w
        message_parts    = []

        if last_rir is not None:
            if last_rir >= target_rir + 2:
                suggested_weight = round(last_w + weight_increment, 2)
                message_parts.append(f"RIR was {last_rir} — bump to {suggested_weight}kg 🔼")
            elif last_rir <= target_rir - 2:
                suggested_weight = round(last_w - weight_increment, 2)
                message_parts.append(f"RIR was {last_rir} — drop to {suggested_weight}kg 🔽")
            else:
                message_parts.append(f"On track — try {suggested_weight}kg × {target_reps} 💪")
        else:
            message_parts.append(f"Keep going: {suggested_weight}kg × {target_reps}")

        return WorkoutSuggestion(
            exercise_id=exercise_id,
            suggested_weight=suggested_weight,
            suggested_reps=target_reps,
            suggested_rir=target_rir,
            message=" ".join(message_parts),
            confidence=0.80,
            reasoning=f"Based on set {last_set.set_number} performance.",
        )

    # No sets today → base on last session
    if last_working:
        last_top  = _top_set_weight(last_working) or 0
        last_avg_rir = _avg_rir(last_working)

        suggested_weight = last_top
        if last_avg_rir is not None and last_avg_rir > target_rir + 1:
            suggested_weight = round(last_top + weight_increment, 2)
            message = f"Last session RIR {last_avg_rir:.0f} — try {suggested_weight}kg × {target_reps} 💪"
        else:
            message = f"Start where you left off: {suggested_weight}kg × {target_reps}"

        return WorkoutSuggestion(
            exercise_id=exercise_id,
            suggested_weight=suggested_weight,
            suggested_reps=target_reps,
            suggested_rir=target_rir,
            message=message,
            confidence=0.75,
            reasoning="Based on last session performance.",
        )

    # No data at all
    return WorkoutSuggestion(
        exercise_id=exercise_id,
        suggested_weight=None,
        suggested_reps=target_reps,
        suggested_rir=target_rir,
        message=f"First time — start light and focus on form 🎯",
        confidence=0.5,
        reasoning="No history available.",
    )


def _build_display_message(
    action: str,
    weight: Optional[float],
    reps: int,
    rir: int,
    name: str,
) -> str:
    short_name = name.split(" ")[0] if " " in name else name

    if action == "INCREASE_WEIGHT" and weight:
        return f"Try {weight}kg × {reps} @ RIR {rir} 🔼"
    elif action == "DELOAD" and weight:
        return f"Back off to {weight}kg — prioritize form 🎯"
    elif action == "CHANGE_REPS":
        return f"Add a rep this session — same weight 📈"
    elif action == "MAINTAIN":
        return f"Solid session — maintain {weight}kg 💪"
    else:
        return f"Keep training consistently 🏋️"