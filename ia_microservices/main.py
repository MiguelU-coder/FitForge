# ai-service/main.py
"""
FitForge AI Microservice
=========================
FastAPI application — entry point.

Run with:
    uvicorn main:app --reload --port 8000
"""
from __future__ import annotations
import structlog
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from routers.ai_router import router as ai_router
from middleware.cache import get_redis
from config import get_settings

settings = get_settings()

# ── Structured logging ────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
)
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger()


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up Redis connection
    try:
        r = await get_redis()
        await r.ping()
        logger.info("startup.redis_connected", url=settings.redis_url)
    except Exception as e:
        logger.warning("startup.redis_unavailable", error=str(e))

    logger.info(
        "startup.complete",
        env=settings.app_env,
        port=settings.app_port,
    )
    yield

    # Shutdown
    logger.info("shutdown.complete")


# ── App factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="FitForge AI Service",
        description=(
            "AI-powered progressive overload, volume analysis, and fatigue detection "
            "for the FitForge fitness platform."
        ),
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Backend (Nest) y Flutter (web/emulador). Flutter en físico usa IP de la máquina.
    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://10.0.2.2:3000",  # Android emulator → host
    ]
    if settings.backend_url:
        origins.append(settings.backend_url.rstrip("/"))
    if getattr(settings, "cors_origins", None):
        origins.extend([o.strip() for o in settings.cors_origins.split(",") if o.strip()])

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Prometheus metrics ────────────────────────────────────────────────────
    Instrumentator().instrument(app).expose(app, endpoint="/metrics")

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(ai_router)

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["System"])
    async def health():
        return {
            "status": "ok",
            "service": "fitforge-ai",
            "version": "1.0.0",
            "env": settings.app_env,
        }

    # ── Global error handler ──────────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_error_handler(request: Request, exc: Exception):
        logger.error("unhandled_exception", path=str(request.url), error=str(exc))
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "type": type(exc).__name__},
        )

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.app_port,
        reload=not settings.is_production,
        log_level="info",
    )
