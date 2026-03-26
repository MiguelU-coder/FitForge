# ia_coach/main.py
"""
FitForge AI Coach — Puerto 8001
=================================
Microservicio de coaching con LLM (OpenRouter) + ExerciseDB.

Funciones:
  1. POST /coach/analyze  → Feedback por set en tiempo real
  2. POST /coach/session  → Resumen al finalizar la rutina
  3. POST /coach/routine  → Generar rutina IA en el onboarding
"""
from __future__ import annotations
import structlog
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from middleware.cache import get_redis
from routers.coach_router import router as coach_router
from config import get_settings

settings = get_settings()

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        r = await get_redis()
        await r.ping()
        logger.info("startup.redis_connected", url=settings.redis_url)
    except Exception as e:
        logger.warning("startup.redis_unavailable", error=str(e))

    logger.info(
        "startup.complete",
        service="fitforge-ai-coach",
        port=settings.app_port,
        model=settings.openrouter_model,
    )
    yield
    logger.info("shutdown.complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title="FitForge AI Coach",
        description=(
            "LLM-powered coaching: per-set feedback, session summaries, "
            "and AI routine generation for the FitForge fitness platform."
        ),
        version="2.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # CORS — permite backend NestJS y Flutter emulador
    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://10.0.2.2:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(coach_router)

    @app.get("/health", tags=["System"])
    async def health():
        return {
            "status": "ok",
            "service": "fitforge-ai-coach",
            "version": "2.0.0",
            "model": settings.openrouter_model,
        }

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
