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

No code changes needed — the `psycopg[binary]` driver is already in
`requirements.txt`. Just set `DATABASE_URL` (see `backend/.env.example`) to a
Postgres connection string. `database.py` normalizes both `postgres://` and
`postgresql://` (the formats hosts like Render/Heroku hand back) to
`postgresql+psycopg://` automatically, so you can paste the connection
string as given without editing it. See [deployment.md](deployment.md) for
the Render setup this is built for.

## Database Migrations (Alembic)

Every schema change through Phase 5 was handled by deleting the local
SQLite file and letting `Base.metadata.create_all()` (called on every app
startup, in `main.py`'s lifespan handler) recreate it from scratch. That
works for local dev but **does nothing to an existing table** —
`create_all` only creates tables that don't exist yet; it never runs
`ALTER TABLE`. Once this app had a real, persistent production database
(Render Postgres), that approach would silently fail to apply any future
column addition.

- **`migrations/`** — Alembic setup. `env.py` points at `app.database`'s
  `DATABASE_URL` and imports `app.models` so `Base.metadata` includes every
  table before a migration runs.
- **`0001_baseline`** — calls `Base.metadata.create_all(bind=op.get_bind())`
  instead of hand-written `op.create_table()` calls. This is deliberately
  idempotent: on a brand-new database it creates every table from the
  current models in one shot; on the already-existing production database
  it's a no-op, since every table it would create already exists.
  `create_all`'s own `checkfirst=True` default is what makes this safe to
  run repeatedly.
- **Every migration after the baseline checks column existence before
  adding one** (`sa.inspect(bind).get_columns(...)`), e.g.
  `0002_add_user_reset_token_fields`. This matters because of a subtle
  ordering issue: `render.yaml`'s `startCommand` runs
  `alembic upgrade head` *before* `uvicorn` starts — deliberately, so a
  schema change is applied before the app that depends on it boots. That
  means on a fresh database, `0001`'s `create_all` will have already
  created a column a later migration also tries to add (since `create_all`
  always builds from *current* models, not a historical snapshot) — the
  existence check is what keeps that from erroring, while still correctly
  adding the column on an existing database that predates it.
- **New tables never need a migration at all** — `create_all` already
  handles "table doesn't exist yet, create it" on both fresh and existing
  databases; Alembic is only needed for changes `create_all` can't express,
  which in practice means adding a column to a table that's already live in
  production.

## Password Reset

- **`User`** gained `reset_token_hash` and `reset_token_expires_at`
  (nullable — most users never trigger a reset). Only the SHA-256 hash of
  the token is stored, mirroring how passwords themselves are never stored
  in plaintext; the raw token exists only in memory long enough to email it.
- **`services/auth_service.py`** — `create_password_reset_token` (random
  32-byte URL-safe token, 1-hour expiry), `get_user_by_reset_token`
  (rejects expired or unknown tokens), `reset_password` (also clears the
  token — single-use). Comparing `reset_token_expires_at` needed a small
  fix: SQLite drops timezone info on read even for a `DateTime(timezone=True)`
  column (Postgres doesn't), so a naive datetime read back from SQLite is
  explicitly re-attached to UTC before comparing — otherwise local dev
  raises `TypeError: can't compare offset-naive and offset-aware datetimes`
  while production silently worked.
- **`services/email_service.py`** — plain `smtplib`, no new dependency.
  Degrades the same way every other optional integration in this app does:
  no `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` configured means
  `send_password_reset_email` returns `False` and no email goes out — the
  reset token is still created either way, and the API response is
  identical regardless (see below), so this never leaks whether delivery
  happened.
- **`POST /auth/forgot-password` always returns `204`,** whether or not the
  email belongs to an account. Revealing that distinction is a classic
  account-enumeration leak; the frontend shows the same "check your email"
  message either way.

## Authentication

- **`models/user.py`** — `User` (email, bcrypt-hashed password, `full_name`,
  `birthday`, and optional `university`/`grad_year`). `full_name` and
  `birthday` are required at registration (`schemas/user.py` validates the
  birthday isn't in the future or absurdly old); `university`/`grad_year` are
  optional. None of this is exposed anywhere except back to the owning user
  via `/auth/me` — `birthday` currently only drives a client-side "happy
  birthday" banner (`components/BirthdayBanner.tsx`, matched on month/day in
  `lib/birthday.ts`), nothing is emailed or shared externally.
- **`services/auth_service.py`** — password hashing/verification (`bcrypt`)
  and JWT creation/decoding (`PyJWT`, `HS256`, secret from `JWT_SECRET_KEY`).
- **`api/deps.py`** — `get_current_user` dependency: reads the `access_token`
  httpOnly cookie, decodes the JWT, loads the `User`, or raises `401`.
- **`api/auth.py`** — `/auth/register`, `/auth/login` (both set the session
  cookie), `/auth/logout` (clears it), `/auth/me`.
- Every `Application` row has a `user_id` FK; `application_service` filters
  every query by the authenticated user's id, and `get`/`update`/`delete`
  return `404` (not `403`) for another user's row, to avoid leaking existence.
- The cookie is always `httponly`. Its `samesite`/`secure` flags depend on
  `ENV`: locally (`ENV=development`, the default) it's `samesite=lax` +
  non-secure, which works over plain HTTP when frontend and backend are on
  the same site (`localhost`, just different ports). In production
  (`ENV=production`) it switches to `samesite=none` + `secure=true`, which
  is *required* once frontend and backend are on different domains
  (Vercel vs. Render) — `Lax` cookies are not sent on cross-site requests,
  and `SameSite=None` is rejected by browsers without `Secure`. See
  `api/auth.py`. CORS is pinned to a specific origin (`CORS_ORIGINS`), which
  is required for cookies to work with `allow_credentials=True` — a
  wildcard origin isn't allowed.

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
- **`POST /resumes/{id}/tailor`** — same `ai_feedback_service.py`, a second
  function (`get_tailoring_suggestions`) and a second `output_format`
  (`TailoringSuggestions`: rewritten summary, bullets to emphasize, missing
  keywords, overall advice). Deliberately **not persisted** — a resume can
  be tailored toward many different jobs, and storing every attempt would
  need its own list-of-results model for a feature that's really just "run
  this analysis again with different input." The frontend keeps the latest
  result in local component state instead.

## AI Career Assistant

- **`models/chat.py`** — `ChatMessage` (`role`: `"user"` | `"assistant"`,
  `content`, owned by `user_id`). One flat, ongoing thread per user — no
  named/multiple conversations, which would need thread management UI this
  feature doesn't need to justify yet.
- **`services/assistant_service.py`** — `build_context_summary` is the part
  that makes this an actual *career* assistant rather than a generic
  chatbot: it pulls real counts and specifics from
  `application_service`/`resume_service`/`contact_service`/`interview_service`
  (active applications, latest resume score, overdue follow-ups, upcoming
  interviews) into a compact text block injected as the system prompt's
  context on every turn — the assistant answers about *this* job search,
  not job searching in the abstract.
- **`services/assistant_ai_service.py`** — uses `client.messages.create`
  (not `.parse()` — this is free-form conversation, not structured
  extraction) with the full message history. Unlike every other AI feature
  in this app, a failure here becomes a normal assistant-role reply
  ("AI isn't configured…") rather than a null/status field, since the chat
  UI has nowhere to render a side-channel status — every turn just needs
  *something* to show.
- **`api/assistant.py`** — `POST /assistant/messages` saves the user's
  message, then the last `MAX_HISTORY` (20) messages become the model's
  context. One subtlety: Anthropic requires the first message in a request
  to have role `"user"`, but slicing an alternating user/assistant sequence
  to the last N messages can land on an assistant message first if N is
  reached mid-pair — the endpoint drops a leading assistant message from
  the slice to guarantee the required ordering.

## Networking CRM

- **`models/contact.py`** — `Contact` (relationship type, company, role,
  email, LinkedIn, follow-up/last-contacted dates, notes; owned by
  `user_id`) and `ContactInteraction` (a timestamped conversation-log entry,
  one-to-many on `Contact` with `cascade="all, delete-orphan"` — deleting a
  contact deletes its interaction history).
- **`services/contact_service.py`** — same CRUD-by-owner pattern as
  `application_service`, plus `add_interaction`/`get_interaction`/
  `delete_interaction`. `list_contacts`/`get_contact` eager-load
  `interactions` via `selectinload` so the full conversation history comes
  back in one query, no N+1.
- **`api/contacts.py`** — `/contacts` CRUD plus nested
  `/contacts/{id}/interactions` for logging/removing a single conversation;
  both layers enforce ownership with the same `404`-not-`403` pattern.
- **Follow-up reminders and "networking analytics"** (Core Features) are
  intentionally *not* separate backend concepts — `follow_up_date` is a
  plain field on `Contact`, and the analytics (total contacts, overdue
  count, breakdown by relationship type) are computed client-side from the
  same `GET /contacts` response already being fetched. No dedicated
  stats/notifications endpoint or background job exists yet.

## Application History & Analytics

- **`models/application.py`** — `Application` gained `resume_id` (nullable FK
  to `resumes.id` — which resume was submitted for this application, set by
  the client at create/edit time, never inferred) and a `status_history`
  relationship to the new `ApplicationStatusEvent` table (one row per status
  the application has ever held, with a timestamp; `cascade="all,
  delete-orphan"` like `Contact.interactions`).
- **`services/application_service.py`** — `create_application` writes the
  initial status event; `update_application` writes a new one *only* when
  `status` actually changes (not on every PATCH — editing notes doesn't spam
  the timeline). `list_applications`/`get_application` eager-load
  `status_history` via `selectinload`, same no-N+1 pattern as contacts.
- **No new backend analytics endpoint.** Offer rate, rejection rate, average
  resume score, status breakdown, applications-over-time, and resume-score
  trend are all computed client-side in `pages/AnalyticsPage.tsx` from data
  the existing `/applications`, `/resumes`, and `/contacts` endpoints already
  return — consistent with the networking-analytics decision above. This
  keeps the backend from needing a bespoke aggregation query per chart; the
  tradeoff is these numbers are only as fresh as React Query's cache and
  don't scale to a dataset too large to fetch in full (not a concern at this
  app's scale).
- **Chart colors are validated, not eyeballed** — see `lib/statusColors.ts`.
  The 5 pipeline statuses (Applied → Final Round) use one blue hue in
  monotone steps (an *ordinal* ramp: order carries meaning, so a single hue
  stepping light→dark is correct — see the dataviz skill's
  `references/color-formula.md`), validated with
  `scripts/validate_palette.js --ordinal` against the app's actual dark
  surface (`#05060a`). Offer/Rejected use reserved status colors (green/red)
  instead of the ordinal ramp — and because red/green is the classic
  deuteranopia collision, both are always paired with a direct text label on
  the chart, never color alone.

## Interview Preparation

- **`models/interview.py`** — `InterviewSession`: optionally linked to an
  `Application` via `application_id` (nullable FK — a prep session doesn't
  require one), plus `interview_type`, `status`, `scheduled_date`,
  `prep_notes` (the "study plan"), `performance_rating`/`performance_notes`
  (post-interview reflection), and `mock_questions` (JSON, populated by AI).
- **`services/interview_ai_service.py`** — same shape as
  `ai_feedback_service.py`: `client.messages.parse(..., output_format=MockQuestionSet)`
  returns validated `{question, tip}` pairs directly. When the session is
  linked to an application, its `role`/`company`/`job_description` are used
  as context instead of the session's own title — the generated questions
  are for the actual job, not a generic prompt. Degrades the same way:
  `ai_feedback_status` of `"not_configured"`/`"error"`/`"ok"`.
- **Question bank is static, not a backend model.** The 17-question
  behavioral/situational/culture-fit/technical bank
  (`frontend/src/lib/questionBank.ts`) is universal content, not
  user-specific data — no CRUD, no ownership, no reason to round-trip it
  through the API. This mirrors the "don't build a backend endpoint for
  things that don't need one" call already made for networking/career
  analytics above.
- **`api/interviews.py`** validates `application_id` the same way
  `api/applications.py` validates `resume_id` (added in the same pass as
  this feature, closing a gap where a cross-user id could be linked without
  a check) — both return `400` if the referenced row isn't the caller's own,
  rather than silently accepting it.

## Frontend

- **`pages/HistoryPage.tsx`** — every application ever created, newest
  `date_applied` first, filterable (All/Active/Offers/Rejected via tab
  counts computed from the same list). Each row expands to show the job
  description, the linked resume, and the full status timeline — this is
  the one screen that answers "what have I actually applied to, and what
  happened."
- **`pages/AnalyticsPage.tsx`** + **`components/charts/`** — `StatusBarChart`
  (horizontal bars, rounded data-ends, per-bar hover tooltip, direct value
  labels) and `TrendChart` (single-hue line + dots, per-point hover) are
  small hand-rolled SVG components rather than a charting library — the
  dataset sizes here don't need one, and it keeps the mark specs (rounded
  ends, hover-to-lift, direct labels) under direct control per the dataviz
  skill's `references/marks-and-anatomy.md`.
- **`pages/LandingPage.tsx`** — public marketing page at `/` for signed-out
  visitors (hero, feature grid, pipeline-stage visual, CTA). Signed-in users
  never see it: `components/GuestRoute.tsx` redirects `/`, `/login`, and
  `/register` straight to `/dashboard`, mirroring how `ProtectedRoute`
  redirects the authenticated-only routes to `/login`.
- **`components/AppHeader.tsx`** — the single nav shell shared by
  Dashboard/Resumes/Contacts (logo, animated active-tab pill via a shared
  `layoutId`, birthday indicator, logout). Replaces what used to be three
  near-identical `<header>` blocks copy-pasted across those pages.
- **`components/OverviewStats.tsx`** — a small stats strip on the dashboard
  computed from applications + resumes + contacts together (active
  applications, offers, overdue follow-ups, latest resume score), each tile
  linking to the page it summarizes. Exists so the three tools read as one
  connected product on first load rather than three disconnected sections;
  the dashboard now also prefetches resumes/contacts via React Query so
  those pages feel instant when clicked into.
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
  form + `ResumeCard` list with an expandable ATS/AI-feedback breakdown),
  `ContactsPage` (analytics summary bar computed client-side from the
  contacts list + `ContactCard` list with an expandable conversation-history
  timeline and inline "log a conversation" form), `InterviewPrepPage` (the
  static question bank alongside `InterviewSessionCard`s — each expandable
  to AI-generated mock questions, a study-plan textarea, and a
  `StarRating` + reflection notes for after the interview), `AssistantPage`
  (a real chat UI — message bubbles, auto-scroll, suggested starter
  questions on the empty state — not another one-shot AI form),
  `ForgotPasswordPage`/`ResetPasswordPage` (the only two routes besides `/`
  reachable while signed in *or* out — a password-reset email can arrive on
  a browser that's still logged into a different account, so these
  deliberately aren't wrapped in `GuestRoute`/`ProtectedRoute`).
- **`components/StudentFigure.tsx`** — small hand-coded inline-SVG people
  (a handful of poses/skin tones/outfit colors), used on the landing page
  instead of real photos (no consent/licensing path for actual student
  photos) or initials-in-a-circle (the placeholder this replaced — visually
  fine but did nothing to make the page feel less templated).
- **`types/`** — TypeScript types mirroring backend Pydantic schemas.
- Data fetching/caching goes through **React Query** — no manual `useEffect`
  fetch/loading-state plumbing.
- **Motion** (`motion/react`) drives page transitions, modal enter/exit, and
  card layout animations (cards animate into place, reflow between status
  columns, and animate out on delete via `AnimatePresence` + `layout`).
  `App.tsx` also wraps `<Routes>` in `AnimatePresence` keyed on
  `location.pathname`, so navigating between pages fades/slides via the
  shared `components/PageFade.tsx` wrapper instead of snapping.
- Dark theme is the only theme (no light/dark toggle) — set directly in
  `index.css` and via Tailwind utility classes throughout, not a `dark:`
  variant layered on a light default. Accent is emerald/teal (green), chosen
  deliberately distinct from the chart status colors in
  `lib/statusColors.ts` — those stay a validated blue ordinal ramp +
  reserved green/red so "Offer" doesn't get lost against the app's own
  chrome now that green is also the brand color.
- **`index.css`**'s `.aurora-bg` (hero pages) and `.aurora-bg-subtle` (every
  other app page) apply the same drifting radial-gradient background via a
  CSS `@keyframes` animation, not JS — a deliberately cheap way to keep
  every screen feeling alive rather than static, with
  `prefers-reduced-motion` respected globally.
