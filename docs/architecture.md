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

## Frontend

- **`api/`** — typed `fetch` wrappers per resource, reading the backend base
  URL from `VITE_API_URL`.
- **`types/`** — TypeScript types mirroring backend Pydantic schemas.
- **`components/`** — `ApplicationBoard` (Kanban-style dashboard grouped by
  status) and `ApplicationFormModal` (create/edit form).
- Data fetching/caching goes through **React Query** — no manual `useEffect`
  fetch/loading-state plumbing.
