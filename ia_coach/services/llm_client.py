# ia_coach/services/llm_client.py
"""
Cliente OpenRouter — compatible con la SDK de OpenAI.
Usa llama-3.3-70b-instruct:free por defecto (sin costo).

El modelo recibe contexto real (peso, reps, RIR) y genera mensajes
completamente originales — NO son strings hardcodeados en el código.
"""
from __future__ import annotations
import structlog
from openai import AsyncOpenAI
from config import get_settings

settings = get_settings()
logger   = structlog.get_logger()

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
            default_headers={
                "HTTP-Referer": "https://fitforge.app",
                "X-Title": "FitForge AI Coach",
            },
        )
    return _client


async def ask_coach(system_prompt: str, user_prompt: str, max_tokens: int = 500) -> str:
    """
    Llama a OpenRouter y devuelve el texto generado por el LLM.
    El contenido es 100% IA — basado en los datos reales del usuario.
    """
    try:
        client = _get_client()
        resp = await client.chat.completions.create(
            model=settings.openrouter_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.7,
        )
        content = resp.choices[0].message.content or ""
        logger.info(
            "llm.response",
            model=settings.openrouter_model,
            tokens_used=resp.usage.total_tokens if resp.usage else 0,
        )
        return content.strip()

    except Exception as e:
        logger.error("llm.error", error=str(e))
        raise
