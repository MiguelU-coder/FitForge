# ai-service/middleware/cache.py
"""
Redis cache layer for AI responses.
Heavy calculations (progression, volume) are cached to avoid
recomputing on every request.
"""
from __future__ import annotations
import json
import hashlib
import redis.asyncio as aioredis
from functools import wraps
from typing import Any, Callable, Optional
from config import get_settings

settings = get_settings()

_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=1.0,         # Fast fail if Redis is down
            socket_connect_timeout=1.0, 
        )
    return _redis


def _make_cache_key(prefix: str, data: Any) -> str:
    """Create a deterministic cache key from request data."""
    serialized = json.dumps(data, sort_keys=True, default=str)
    digest = hashlib.md5(serialized.encode()).hexdigest()
    return f"ai:{prefix}:{digest}"


async def cache_get(key: str) -> Optional[dict]:
    try:
        r = await get_redis()
        val = await r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


async def cache_set(key: str, value: dict, ttl: int = 3600) -> None:
    try:
        r = await get_redis()
        await r.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass  # cache failures are non-fatal


async def cache_delete_pattern(pattern: str) -> None:
    """Invalidate cache keys matching a pattern (e.g. after new workout)."""
    try:
        r = await get_redis()
        keys = await r.keys(pattern)
        if keys:
            await r.delete(*keys)
    except Exception:
        pass


def cached(prefix: str, ttl: int = 3600):
    """
    Decorator for async endpoint functions.
    Caches the result in Redis keyed by prefix + request body hash.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract the request body (first Pydantic model arg)
            req = None
            for arg in args:
                if hasattr(arg, "model_dump"):
                    req = arg
                    break
            for v in kwargs.values():
                if hasattr(v, "model_dump"):
                    req = v
                    break

            if req is None:
                return await func(*args, **kwargs)

            key    = _make_cache_key(prefix, req.model_dump())
            cached_val = await cache_get(key)

            if cached_val:
                return cached_val

            result = await func(*args, **kwargs)

            if hasattr(result, "model_dump"):
                await cache_set(key, result.model_dump(), ttl)
            elif isinstance(result, dict):
                await cache_set(key, result, ttl)

            return result
        return wrapper
    return decorator