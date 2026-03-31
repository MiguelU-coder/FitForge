# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

FitForge is a polyglot fitness platform monorepo with five distinct services:

| Service | Directory | Language | Port |
|---|---|---|---|
| NestJS API | `backend/` | TypeScript | 3000 |
| React Admin | `admin_web/` | TypeScript | 5173 |
| AI Analytics | `ia_microservices/` | Python | 8000 |
| AI Coach (LLM) | `ia_coach/` | Python | 8001 |
| Mobile App | `fitforge_flutter/` | Dart/Flutter | — |

Infrastructure (via Docker): PostgreSQL 16 (5432), Redis 7 (6379), n8n (5678), Adminer (8080), Redis Commander (8081).

## Commands

### Backend (NestJS)
```bash
cd backend
npm run start:dev        # dev server with hot reload
npm run build            # compile TypeScript
npm run lint             # ESLint with auto-fix
npm test                 # unit tests (Jest)
npm run test:e2e         # e2e tests
npm run test:cov         # coverage report
npm run db:migrate       # run Prisma migrations (dev)
npm run db:generate      # regenerate Prisma client after schema changes
npm run db:seed          # seed database
npm run db:studio        # open Prisma Studio
```

### Admin Web (React + Vite)
```bash
cd admin_web
npm run dev              # dev server
npm run build            # tsc + vite build
npm run lint             # ESLint
```

### AI Microservices (Python)
```bash
cd ia_microservices
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
pytest                   # run tests
```

### AI Coach (Python)
```bash
cd ia_coach
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Docker (infrastructure only)
```bash
docker compose up -d postgres redis adminer redis-commander
```

## Architecture

### Backend Module System

NestJS modules are feature-scoped under `backend/src/modules/`. Global infrastructure modules (`PrismaModule`, `SharedModule`, `JobsModule`) are registered once and available everywhere. Feature modules follow a controller → service → repository pattern, with shared guards and interceptors injected globally:

- **JwtAuthGuard** — global, uses Passport JWT strategy; bypass with `@Public()`
- **RolesGuard** — enforces `Client | Trainer | OrgAdmin | GlobalAdmin` roles
- **SubscriptionGuard** — gates features behind billing plan status
- **AuditInterceptor** — captures all mutating operations to `AuditLog`

TypeScript path aliases (configured in `backend/tsconfig.json`): `@common`, `@modules`, `@config`, `@database`, `@shared`, `@jobs`.

### Authentication Flow

Dual-mode JWT: custom NestJS JWTs (15m access / 7d refresh, Argon2 passwords) **or** Supabase-issued JWTs. Both token types are verified by the Passport strategy. The `JWT_ACCESS_SECRET` is shared with the Python services so they can independently verify tokens without calling back to NestJS.

### AI Service Bridge

NestJS calls the Python services via HTTP through an AI Bridge module:
- `backend/src/modules/ai-bridge/` → calls `ia_microservices` at `AI_SERVICE_URL` (default `http://localhost:8000`)
- `backend/src/modules/ia-coach/` → calls `ia_coach` at `AI_COACH_URL` (default `http://127.0.0.1:8001`)

Both Python services authenticate incoming requests using the same `JWT_ACCESS_SECRET`.

### Python Service Layout

**ia_microservices** uses an engine-based architecture: `engines/` contains pluggable analytics engines (`progressive_overload`, `volume_analysis`, `fatigue_detection`, `injury_risk`, `pr_prediction`, `recovery_prediction`, `ml/anomaly_detector`). Each engine is independently invokable and Redis-cached (TTL varies: 1800–3600s, keyed as `fitforge:<user_id>:<function>:<params_hash>`).

**ia_coach** uses a service-oriented layout: `services/llm_client.py` (Gemini 1.5 Flash via `google-genai`), `services/exercise_api.py` (ExerciseDB via RapidAPI), `services/prompt_builder.py` (dynamic prompt assembly). LLM responses are parsed as structured JSON.

### Flutter Architecture

Feature-first layout under `fitforge_flutter/lib/features/`. State is managed via Riverpod (`flutter_riverpod` + code generation with `riverpod_annotation`). Navigation uses GoRouter. HTTP is handled by Dio. Auth and realtime subscriptions go through Supabase Flutter client.

### Database Schema

Prisma schema at `backend/prisma/schema.prisma`. Key domain entities: `User`, `Organization`, `UserOrganization` (multi-tenant membership), `Exercise`, `WorkoutSession`, `Set`, `PersonalRecord`, `BodyMetrics`, `Program`, `Routine`, `GymClass`, `BillingPlan`, `MembershipPlan`, `SupportTicket`, `AuditLog`.

Multi-tenancy is org-scoped: users belong to organizations with roles (`Client`, `Trainer`, `OrgAdmin`). Always scope data queries by organization when working in the org context.

## Environment Setup

Each service requires its own `.env` file. Copy from `.env.example` files. Critical shared variables:

- `JWT_ACCESS_SECRET` — must match across `backend/.env`, `ia_microservices/.env`, `ia_coach/.env`
- `REDIS_URL` — shared by all three backend services
- `DATABASE_URL` — Prisma connection string (backend only)
- `GEMINI_API_KEY` — required for ia_coach
- `EXERCISE_DB_API_KEY` — RapidAPI key for ExerciseDB (ia_coach)
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — backend Supabase integration
- `SUPABASE_URL` + `SUPABASE_ANON_KEY` — Flutter app

After any `schema.prisma` change, run `npm run db:generate` and `npm run db:migrate` before starting the backend.
