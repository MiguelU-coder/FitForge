# ia_coach/middleware/cache.py
"""
Redis cache layer — idéntico al de ia_microservices.
"""
from __future__ import annotations
import json
import hashlib
import redis.asyncio as aioredis
from typing import Any, Optional
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
        )
    return _redis


def _make_cache_key(prefix: str, data: Any) -> str:
    serialized = json.dumps(data, sort_keys=True, default=str)
    digest = hashlib.md5(serialized.encode()).hexdigest()
    return f"coach:{prefix}:{digest}"


async def cache_get(key: str) -> Optional[dict]:
    try:
        r   = await get_redis()
        val = await r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


async def cache_set(key: str, value: dict, ttl: int = 3600) -> None:
    try:
        r = await get_redis()
        await r.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass
