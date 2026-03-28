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

CRITICAL SAFETY RULES - YOU MUST FOLLOW THESE EXACTLY:
1. RIR (Reps In Reserve): 0 = failure, 1 = 1 rep left, 2 = 2 reps left, etc.
2. RPE (Rate of Perceived Exertion): 10 = failure, 9 = 1 rep left, 8 = 2 reps left (RPE = 10 - RIR)
3. When RIR <= 1 OR RPE >= 9: NEVER recommend increasing weight - this is dangerous!
4. When RIR = 0 (failure) or RPE = 10: ALWAYS warn user and recommend rest or weight reduction
5. injury_risk: if "HIGH" or "MODERATE", MUST include warning and recommend reducing weight
6. fatigue_score > 70: MUST recommend shorter rest or ending the exercise
7. Single reps (1 rep) at high intensity: DO NOT recommend adding weight

YOUR PRIMARY GOAL IS INJURY PREVENTION. Progressive overload matters, but NOT at the cost of injury.
When in doubt, be CONSERVATIVE - suggest maintaining or reducing weight rather than risking injury.
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
        f"  Set {i+1}: {s.get('weight', '?')}kg × {s.get('reps', '?')} reps @ RPE {s.get('rpe', '?')}, RIR {s.get('rir', '?')}"
        for i, s in enumerate(recent_sets)
    )

    last_set = recent_sets[-1] if recent_sets else {}
    weight   = last_set.get("weight", "unknown")
    reps     = last_set.get("reps", "unknown")
    rpe      = last_set.get("rpe", "unknown")
    rir      = last_set.get("rir")  # May be None

    # Calcular RIR estimado desde RPE
    if rir is not None:
        rir_estimated = rir
    elif isinstance(rpe, (int, float)):
        rir_estimated = 10 - float(rpe)
    else:
        rir_estimated = "unknown"

    volume_line = f"- Weekly volume so far: {weekly_volume:.0f}kg" if weekly_volume else ""

    return f"""
Analiza este set de entrenamiento y proporciona retroalimentación específica:

EJERCICIO: {exercise}
ÚLTIMO SET: {weight}kg × {reps} reps @ RPE {rpe}, RIR {rir_estimated}
TODOS LOS SETS DE ESTE EJERCICIO:
{sets_text}

ESTADÍSTICAS DEL USUARIO:
- 1RM estimado para este ejercicio: {estimated_1rm:.1f}kg
- Nivel de fatiga actual: {fatigue_score:.0f}/100 (0=descansado, 100=agotado)
- Nivel de riesgo de lesión: {injury_risk}
- Récord personal en este set: {"SÍ 🏆" if is_pr else "No"}
{volume_line}

⚠️ INSTRUCCIONES DE SEGURIDAD OBLIGATORIAS:
- Si RIR <= 1 (o RPE >= 9): El usuario está en riesgo. NO recomiendes aumentar peso.
- Si RIR = 0 (failure): Este es un set a fallo. Recomienda DESCANSAR o mantener peso.
- Si injury_risk es HIGH: Recomienda REDUCIR peso o terminar el ejercicio.
- Si injury_risk es MODERATE: Recomienda mantener o reducir peso, NO aumentar.
- Si fatigue_score > 70: El usuario está fatigado. Recomienda descansar más.
- Si es 1 solo rep a alta intensidad: ¡PELIGRO! No sugerir aumento.

Responde SOLO en JSON válido con esta estructura exacta:
{{
  "summary": "Una oración sobre el rendimiento de ESTE set específico (menciona peso/reps/RIR si aplica)",
  "insights": ["2-3 observaciones específicas sobre los datos anteriores"],
  "recommendations": ["1-2 recomendaciones concretas - SI RIR <= 1 O injury_risk=HIGH: recomendar mantener o reducir peso, NO aumentar"],
  "warnings": ["SIEMPRE incluye warning si: RIR <= 1, O injury_risk=HIGH/MODERATE, O fatigue_score > 70, O reps=1 a alta intensidad. Ej: 'Riesgo de lesión elevado - considera reducir peso'"],
  "motivation": "Una oración corta motivacional"
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
- Use Mike Israetel's MEV/MRV framework for volume.
- Include progressive overload instructions.
- Specify sets, rep ranges, and RIR targets for each exercise.
- **CRITICAL: Generate a set of UNIQUE workout templates.** 
- If training {days_per_week} days/week, provide 2 to 4 UNIQUE templates (e.g. 'Push', 'Pull', 'Legs' or 'Upper', 'Lower').
- **DO NOT repeat the same workout content multiple times in the JSON.** The app will handle the weekly scheduling.
- Each session should have a distinct name (e.g., 'Upper A', 'Lower A').
- Duration 45-75 minutes per session.

Respond ONLY in valid JSON with this exact structure:
{{
  "routine_name": "Name of the training program",
  "weeks_duration": 8,
  "days_per_week": {days_per_week},
  "sessions": [
    {{
      "day_label": "Unique Session Name (e.g. Upper Body A)",
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
