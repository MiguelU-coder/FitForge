# ia_coach/services/prompt_builder.py
"""
Constructores de prompts para el AI Coach.
Todos los prompts inyectan datos REALES del usuario (peso, reps, RIR)
para que el LLM genere respuestas 100% personalizadas.
Los mensajes NO son hardcodeados — vienen del modelo de IA.
"""
from __future__ import annotations


# ── System prompt base del coach ──────────────────────────────────────────────
COACH_SYSTEM = """
You are FitForge AI Coach, an expert personal trainer and sports scientist specializing in
evidence-based strength training and hypertrophy programming. Your coaching style is:
- Direct and motivating, never generic
- Science-based (Mike Israetel's RIR methodology, progressive overload principles)
- Specific to the ACTUAL numbers provided (weight, reps, RIR)
- Concise for in-workout messages (max 3 sentences per field)
- Bilingual: respond in SPANISH if the data includes Spanish context, otherwise match the user language

CRITICAL: You MUST base your analysis on the exact weight, reps, and RIR data provided.
Never give generic advice. Always reference the specific numbers in your response.
""".strip()


def build_set_feedback_prompt(
    exercise: str,
    recent_sets: list[dict],
    fatigue_score: float,
    estimated_1rm: float,
    is_pr: bool,
    injury_risk: str,
    weekly_volume: float | None = None,
) -> str:
    """
    Prompt para análisis en tiempo real después de cada set.
    Inyecta los datos exactos del set para feedback personalizado.
    """
    sets_text = "\n".join(
        f"  Set {i+1}: {s.get('weight', '?')}kg × {s.get('reps', '?')} reps @ RPE {s.get('rpe', '?')}"
        for i, s in enumerate(recent_sets)
    )

    last_set = recent_sets[-1] if recent_sets else {}
    weight   = last_set.get("weight", "unknown")
    reps     = last_set.get("reps", "unknown")
    rpe      = last_set.get("rpe", "unknown")

    # Calcular RIR estimado desde RPE
    rir_estimated = 10 - float(rpe) if isinstance(rpe, (int, float)) else "unknown"

    volume_line = f"- Weekly volume so far: {weekly_volume:.0f}kg" if weekly_volume else ""

    return f"""
Analyze this workout set and provide specific coaching feedback:

EXERCISE: {exercise}
LAST SET: {weight}kg × {reps} reps @ RPE {rpe} (estimated RIR: {rir_estimated})
ALL SETS THIS EXERCISE:
{sets_text}

USER STATS:
- Estimated 1RM for this exercise: {estimated_1rm:.1f}kg
- Current fatigue score: {fatigue_score:.0f}/100 (0=fresh, 100=exhausted)
- Injury risk level: {injury_risk}
- Personal Record this set: {"YES 🏆" if is_pr else "No"}
{volume_line}

Respond ONLY in valid JSON with this exact structure:
{{
  "summary": "One sentence headline about THIS specific set performance (mention actual weight/reps)",
  "insights": ["2-3 specific observations about the data above"],
  "recommendations": ["1-2 concrete next-set recommendations with specific weight/rep targets"],
  "warnings": ["Only include if injury_risk is HIGH or fatigue_score > 80, otherwise empty array"],
  "motivation": "One short motivational sentence, personalized to this performance"
}}
""".strip()


def build_session_summary_prompt(
    exercises: list[dict],
    duration_min: int | None = None,
    total_volume: float | None = None,
) -> str:
    """
    Prompt para el resumen completo de sesión al finalizar.
    """
    exercise_lines = []
    for ex in exercises:
        name = ex.get("exercise", "Unknown")
        sets = ex.get("sets", [])
        is_pr = ex.get("isPR", False)
        sets_text = ", ".join(
            f"{s.get('weight', '?')}kg×{s.get('reps','?')}@RPE{s.get('rpe','?')}"
            for s in sets
        )
        pr_tag = " 🏆 PR!" if is_pr else ""
        exercise_lines.append(f"  - {name}{pr_tag}: {sets_text}")

    exercises_block = "\n".join(exercise_lines)
    duration_line   = f"- Duration: {duration_min} minutes" if duration_min else ""
    volume_line     = f"- Total volume lifted: {total_volume:.1f}kg" if total_volume else ""

    return f"""
Provide a post-workout session analysis:

SESSION DATA:
{exercises_block}
{duration_line}
{volume_line}

Respond ONLY in valid JSON with this exact structure:
{{
  "summary": "2-3 sentence overall session assessment (mention specific exercises and PRs if any)",
  "insights": ["3-4 key observations about performance, volume, or patterns across the session"],
  "recommendations": ["2-3 specific recommendations for the NEXT session"],
  "warnings": ["Any recovery or overtraining concerns, or empty array"],
  "motivation": "One energizing closing statement referencing something specific from this session"
}}
""".strip()


def build_routine_generation_prompt(
    goal: str,
    training_level: str,
    gender: str,
    age: int | None,
    weight_kg: float | None,
    goal_weight_kg: float | None,
    days_per_week: int,
    available_exercises: list[dict],
) -> str:
    """
    Prompt para generar una rutina personalizada al completar el onboarding.
    """
    exercises_sample = "\n".join(
        f"  - {ex['name']} ({ex.get('target', '')} via {ex.get('equipment', '')})"
        for ex in available_exercises[:20]
    )

    age_line    = f"- Age: {age}" if age else ""
    weight_line = f"- Current weight: {weight_kg}kg" if weight_kg else ""
    goal_w_line = f"- Goal weight: {goal_weight_kg}kg" if goal_weight_kg else ""

    return f"""
Create a science-based workout routine for this user profile:

USER PROFILE:
- Primary goal: {goal}
- Training level: {training_level}
- Gender: {gender}
{age_line}
{weight_line}
{goal_w_line}
- Days available per week: {days_per_week}

AVAILABLE EXERCISES (from ExerciseDB):
{exercises_sample}

GUIDELINES:
- Use Mike Israetel's MEV/MRV framework for volume
- Include progressive overload instructions
- Specify sets, rep ranges, and RIR targets for each exercise
- Structure in logical training splits (Push/Pull/Legs or Full Body based on frequency)
- Duration 45-75 minutes per session

Respond ONLY in valid JSON with this exact structure:
{{
  "routine_name": "Name of the training program",
  "weeks_duration": 8,
  "days_per_week": {days_per_week},
  "sessions": [
    {{
      "day_label": "Day 1 - Push",
      "exercises": [
        {{
          "name": "Exercise name",
          "sets": 4,
          "reps": "8-10",
          "rir": 2,
          "rest_seconds": 120,
          "notes": "Specific technique tip"
        }}
      ]
    }}
  ],
  "progression_notes": "How to apply progressive overload each week",
  "general_notes": "Recovery and nutrition brief notes"
}}
""".strip()
