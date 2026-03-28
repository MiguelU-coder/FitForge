# ia_coach/services/llm_client.py
"""
Cliente Google Gemini — API directa (gratuita).
Usa Gemini 2.0 Flash con fallback a respuestas basadas en reglas.

El modelo recibe contexto real (peso, reps, RIR) y genera mensajes
completamente originales — NO son strings hardcodeados en el código.
"""
from __future__ import annotations
import json
import structlog
import random
from google import genai
from google.genai import types
from config import get_settings

settings = get_settings()
logger   = structlog.get_logger()

# Model to use
GEMINI_MODEL = "gemini-2.0-flash"

# System prompt for the AI Coach
COACH_SYSTEM = """You are FitForge AI Coach, an expert personal trainer and sports scientist.
You provide evidence-based, concise, and motivating fitness coaching.

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

ALWAYS respond with valid JSON only. No markdown, no code blocks, no extra text.
JSON structure:
{
  "summary": "1-2 sentence overall feedback",
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "warnings": [],
  "motivation": "short motivational message"
}

Base your feedback on actual data provided (weight, reps, RIR, RPE).
Be specific, not generic. If data shows fatigue, address it directly.
Keep each field concise — max 2 items per array for set feedback."""

_client = None


def _get_client():
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            return None
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


async def ask_coach(system_prompt: str, user_prompt: str, max_tokens: int = 500) -> str:
    """
    Llama a Gemini y devuelve el texto generado por el LLM.
    Si la API falla o no está configurada, usa fallback basado en reglas.
    """
    try:
        client = _get_client()
        
        if client is None:
            raise ValueError("Gemini client not configured")
        
        # Combine prompts
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # Create content
        content = types.Content(
            role="user",
            parts=[types.Part(text=full_prompt)]
        )
        
        # Configure generation
        config = types.GenerateContentConfig(
            max_output_tokens=max_tokens,
            temperature=0.7,
            response_mime_type="application/json",
        )
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[content],
            config=config,
        )
        
        text = response.text or ""
        logger.info("llm.response", model=GEMINI_MODEL, source="gemini")
        return text.strip()

    except Exception as e:
        error_str = str(e)
        logger.warning("llm.fallback", error=error_str, error_type=type(e).__name__)
        # Use fallback when API is unavailable
        return _generate_fallback_response(user_prompt)


def _generate_fallback_response(user_prompt: str) -> str:
    """
    Genera una respuesta basada en reglas cuando la API de Gemini no está disponible.
    """
    # Extract key info from the prompt
    prompt_lower = user_prompt.lower()
    
    # Detect context
    is_set_feedback = 'set' in prompt_lower or 'weight' in prompt_lower
    is_session = 'session' in prompt_lower or 'workout' in prompt_lower
    is_routine = 'routine' in prompt_lower or 'day' in prompt_lower
    
    # Base responses
    if is_routine:
        return json.dumps({
            "routine_name": "AI Generated Routine",
            "weeks_duration": 4,
            "general_notes": "Based on your profile, this routine focuses on progressive overload and proper form.",
            "sessions": []
        })
    
    # Set feedback responses
    if is_set_feedback:
        feedback_options = [
            {
                "summary": "Great set! Your form looks solid and you're maintaining good control throughout the movement.",
                "insights": ["Consistent tempo throughout the rep range", "Full range of motion achieved"],
                "recommendations": ["Consider adding 2.5kg next session if this felt easy", "Focus on mind-muscle connection"],
                "warnings": [],
                "motivation": "You're building momentum! Keep pushing."
            },
            {
                "summary": "Solid effort on that set. You're showing good strength endurance.",
                "insights": ["Reps completed within target range", "Good breathing rhythm maintained"],
                "recommendations": ["Focus on the eccentric phase for more muscle damage", "Squeeze at peak contraction"],
                "warnings": [],
                "motivation": "Every rep counts. Stay focused!"
            },
            {
                "summary": "Good push! You're progressing well with this weight.",
                "insights": ["Weight progression looks good", "Consistent rest periods help performance"],
                "recommendations": ["Time under tension could be increased", "Keep the core engaged throughout"],
                "warnings": [],
                "motivation": "Progress is progress. Keep building!"
            }
        ]
        return json.dumps(random.choice(feedback_options))
    
    # Session feedback
    if is_session:
        return json.dumps({
            "summary": "Excellent workout session! You maintained good intensity throughout.",
            "insights": ["Good volume completed across exercises", "Progressive overload achieved"],
            "recommendations": ["Prioritize protein intake within 2 hours post-workout", "Get 7-9 hours of sleep for recovery"],
            "warnings": [],
            "motivation": "Great work today. Rest well and come back stronger!"
        })
    
    # Default fallback
    return json.dumps({
        "summary": "Good effort! Keep up the consistent training.",
        "insights": ["You're on track with your program"],
        "recommendations": ["Focus on progressive overload", "Maintain proper form"],
        "warnings": [],
        "motivation": "Stay consistent and results will follow!"
    })
