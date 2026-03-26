# ia_coach/middleware/auth.py
"""
Mismo middleware de autenticación que ia_microservices.
Reutilizado directamente — soporta ES256 (Supabase) y HS256 (NestJS).
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

_jwks_cache: Optional[dict] = None
_jwks_fetched_at: float = 0
_JWKS_TTL = 86400


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
    secret = settings.jwt_access_secret or settings.app_secret
    if not secret or secret == "dev_secret_change_in_production":
        return None
    try:
        return jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except (JWTError, JWTClaimsError):
        return None


async def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Security(_security),
) -> dict:
    token = credentials.credentials

    # Dev mode
    if not settings.supabase_url and (
        not settings.app_secret
        or settings.app_secret == "dev_secret_change_in_production"
    ):
        return {"sub": "dev_user", "dev_mode": True}

    last_error = "Authentication failed"

    if settings.supabase_url:
        try:
            jwks    = await _get_jwks()
            payload = jwt.decode(token, jwks, algorithms=["ES256", "RS256"], options={"verify_aud": False})
            return payload
        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except Exception as e:
            last_error = str(e)

    hs256_payload = _try_hs256(token)
    if hs256_payload is not None:
        return hs256_payload

    raise HTTPException(status_code=401, detail=f"Invalid token: {last_error}")


def get_user_id(payload: dict = Depends(verify_jwt_token)) -> str:
    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="No user ID in token")
    return uid
