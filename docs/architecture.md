# Architecture

## Overview

```
Frontend (React + TS + Tailwind + React Query)
        │  HTTP/JSON
        ▼
Backend (FastAPI)
  ├── api/        — route handlers, thin
  ├── schemas/    — Pydantic request/response models
  ├── services/   — business logic, DB queries
  ├── models/     — SQLAlchemy ORM models
  └── database.py — engine/session/Base
        │
        ▼
Database (SQLite for local dev, swappable to Postgres via DATABASE_URL)
```

## Backend layering

- **`api/`** — `APIRouter`s that parse the request, call a service function, and
  return a schema. No SQLAlchemy queries live here.
- **`schemas/`** — Pydantic models. `*Create`/`*Update` validate input;
  `*Read` (with `from_attributes=True`) shapes ORM objects for JSON responses.
- **`services/`** — plain functions that take a `Session` and do the actual
  querying/mutation. This is where business logic goes as it grows (e.g.
  resume scoring, referral matching) without bloating route handlers.
- **`models/`** — SQLAlchemy `Mapped`/`mapped_column` models, one file per
  domain entity.
- **`database.py`** — creates the engine from `DATABASE_URL` (defaults to
  `sqlite:///./offerflow.db`), exposes `Base` for models and `get_db()` as a
  FastAPI dependency.

## Swapping SQLite for Postgres

No code changes needed — set `DATABASE_URL` (see `backend/.env.example`) to a
Postgres connection string, e.g. `postgresql://user:pass@host:5432/offerflow`,
and install a Postgres driver (`psycopg[binary]`) alongside the existing
requirements.

## Authentication

- **`models/user.py`** — `User` (email, bcrypt-hashed password).
- **`services/auth_service.py`** — password hashing/verification (`bcrypt`)
  and JWT creation/decoding (`PyJWT`, `HS256`, secret from `JWT_SECRET_KEY`).
- **`api/deps.py`** — `get_current_user` dependency: reads the `access_token`
  httpOnly cookie, decodes the JWT, loads the `User`, or raises `401`.
- **`api/auth.py`** — `/auth/register`, `/auth/login` (both set the session
  cookie), `/auth/logout` (clears it), `/auth/me`.
- Every `Application` row has a `user_id` FK; `application_service` filters
  every query by the authenticated user's id, and `get`/`update`/`delete`
  return `404` (not `403`) for another user's row, to avoid leaking existence.
- The cookie is `httponly` + `samesite=lax` — safe from JS/XSS reading it,
  and sent automatically on same-site requests (both frontend and backend run
  on `localhost`, just different ports). CORS is pinned to a specific origin
  (`CORS_ORIGINS`), which is required for cookies to work with
  `allow_credentials=True` — a wildcard origin isn't allowed.

## Resume Intelligence

- **`models/resume.py`** — `Resume`: uploaded file metadata, extracted text,
  the optional job description pasted alongside it, ATS scoring results, and
  AI feedback (all owned by a `user_id`, same ownership pattern as
  `Application`).
- **`services/resume_service.py`** — file handling and scoring, no AI calls:
  - `extract_text` — `pypdf` for `application/pdf`, plain decode for
    `text/plain`.
  - `score_resume` — deterministic, rule-based ATS score (0-100): contact
    info present, quantifiable achievements (numbers/%/$ in the text),
    resume length in a reasonable word-count range, standard section headers
    detected, and — when a job description is supplied — keyword overlap
    between the two. Returns per-check pass/fail detail plus matched/missing
    keyword lists, so the score is always explainable, never a black box.
  - `save_upload`/`delete_file` — stores the raw file under
    `backend/uploads/resumes/<user_id>/` (gitignored, local-disk only for
    now — see Postgres note above for the equivalent future swap to object
    storage).
- **`services/ai_feedback_service.py`** — the one place that calls an LLM.
  Uses the `anthropic` SDK's `client.messages.parse(..., output_format=AIFeedback)`
  to get a validated `strengths`/`weaknesses`/`suggestions`/`overall_summary`
  object back directly, no manual JSON parsing. Model is `claude-opus-5` by
  default, overridable via `ANTHROPIC_MODEL`. **Degrades gracefully**: if no
  Anthropic credentials are configured, the resume is still scored and saved
  — `ai_feedback` is just `null` with `ai_feedback_status: "not_configured"`
  instead of the request failing.
- **`api/resumes.py`** — `POST /resumes` (multipart: `file` + optional
  `job_description` form field) runs extraction → scoring → AI feedback →
  storage → save, in that order, and returns the full `ResumeRead` in one
  response (no polling/async job needed at this scale). `GET`/`DELETE` follow
  the same per-user ownership + `404` pattern as applications.

## Frontend

- **`api/client.ts`** — shared `apiFetch` wrapper: always sends
  `credentials: 'include'` (required for the auth cookie) and throws
  `ApiError` with the backend's `detail` message on non-2xx responses.
- **`api/`** — typed wrappers per resource (`applications.ts`, `auth.ts`)
  built on `apiFetch`, reading the backend base URL from `VITE_API_URL`.
- **`context/AuthContext.tsx`** — holds the current `User` (or `null`),
  restores an existing session on load via `GET /auth/me`, exposes
  `login`/`register`/`logout`.
- **`components/ProtectedRoute.tsx`** — redirects to `/login` when there's no
  authenticated user; used to gate the dashboard route in `App.tsx`.
- **`pages/`** — `LoginPage`, `RegisterPage`, `DashboardPage` (the Kanban
  board + add/edit modal, previously all of `App.tsx`), `ResumesPage` (upload
  form + `ResumeCard` list with an expandable ATS/AI-feedback breakdown).
- **`types/`** — TypeScript types mirroring backend Pydantic schemas.
- Data fetching/caching goes through **React Query** — no manual `useEffect`
  fetch/loading-state plumbing.
- **Motion** (`motion/react`) drives page transitions, modal enter/exit, and
  card layout animations (cards animate into place, reflow between status
  columns, and animate out on delete via `AnimatePresence` + `layout`).
- Dark theme is the only theme (no light/dark toggle) — set directly in
  `index.css` and via Tailwind utility classes throughout, not a `dark:`
  variant layered on a light default.
