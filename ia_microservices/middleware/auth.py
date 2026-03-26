# ai-service/middleware/auth.py
"""
Dual JWT verification for FastAPI.
Acepta dos tipos de token:
  1. ES256/RS256 — JWT de Supabase (verificado con JWKS localmente descargado)
  2. HS256 — JWT propio del backend NestJS (verificado con JWT_ACCESS_SECRET o APP_SECRET)

Orden de intento:
  1. Si hay SUPABASE_URL configurado → intenta RS256/ES256 con JWKS
  2. Si falla por algoritmo o no hay JWKS → intenta HS256 con backend secret
  3. Si ninguno funciona → 401
"""
from __future__ import annotations
import time
import httpx
from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from jose.exceptions import JWTClaimsError
from config import get_settings

settings  = get_settings()
_security = HTTPBearer(auto_error=True)

# ── In-memory JWKS cache ──────────────────────────────────────────────────────
_jwks_cache: Optional[dict] = None
_jwks_fetched_at: float = 0
_JWKS_TTL = 86400  # 24 hours


async def _get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at

    if _jwks_cache and (time.time() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"

    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url, timeout=10)
        resp.raise_for_status()
        _jwks_cache      = resp.json()
        _jwks_fetched_at = time.time()
        return _jwks_cache


def _try_hs256(token: str) -> Optional[dict]:
    """
    Intenta verificar el token como HS256 (JWT del backend NestJS).
    Usa jwt_access_secret si está configurado, sino app_secret como fallback.
    Devuelve el payload si es válido, None si no hay secret configurado.
    Lanza HTTPException si el token está expirado.
    """
    # Prioridad: JWT_ACCESS_SECRET > APP_SECRET
    secret = settings.jwt_access_secret or settings.app_secret
    if not secret or secret == "dev_secret_change_in_production":
        return None

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except (JWTError, JWTClaimsError):
        return None  # Token inválido para HS256 → dejar que falle el 401 final


async def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Security(_security),
) -> dict:
    """
    Verifica el JWT de la request. Acepta:
      - ES256/RS256 (Supabase) cuando SUPABASE_URL está configurado
      - HS256 (NestJS) cuando JWT_ACCESS_SECRET/APP_SECRET está configurado
      - Dev mode       cuando ninguno está configurado (retorna payload ficticio)

    Devuelve el payload decodificado al handler.
    """
    token = credentials.credentials

    # ── Dev mode: sin ninguna verificación configurada ────────────────────────
    if not settings.supabase_url and (
        not settings.app_secret
        or settings.app_secret == "dev_secret_change_in_production"
    ):
        return {"sub": "dev_user", "dev_mode": True}

    last_error: str = "Authentication failed"

    # ── Intento 1: RS256/ES256 con JWKS de Supabase ───────────────────────────
    if settings.supabase_url:
        try:
            jwks = await _get_jwks()
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["ES256", "RS256"],
                options={"verify_aud": False},
            )
            return payload  # ✅ Token de Supabase válido

        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except (JWTError, JWTClaimsError, Exception) as e:
            # Cualquier error → intentar HS256 a continuación.
            last_error = str(e)


    # ── Intento 2: HS256 con secret del backend NestJS ────────────────────────
    hs256_payload = _try_hs256(token)
    if hs256_payload is not None:
        return hs256_payload  # ✅ Token del backend válido

    # ── Ninguno funcionó → 401 ────────────────────────────────────────────────
    raise HTTPException(
        status_code=401,
        detail=f"Invalid token: {last_error}",
    )


# Convenience: extract user_id from either token type
def get_user_id(payload: dict = Depends(verify_jwt_token)) -> str:
    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="No user ID in token")
    return uid