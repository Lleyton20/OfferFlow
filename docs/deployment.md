# Deployment

Backend + Postgres on **Render**, frontend on **Vercel** — matches the stack
in the README. Both have free tiers and deploy straight from this GitHub
repo, no CLI needed.

## 1. Backend + database (Render)

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. **New +** → **Blueprint** → select the `OfferFlow` repo. Render will find
   `render.yaml` at the repo root and propose a web service
   (`offerflow-backend`) plus a Postgres database (`offerflow-db`) together.
3. Click **Apply**. Render wires `DATABASE_URL` from the database to the web
   service automatically and generates `JWT_SECRET_KEY` for you.
4. Once it's live, copy the service's public URL (e.g.
   `https://offerflow-backend.onrender.com`) — you'll need it in step 2.
5. Optional: open the service's **Environment** tab and set
   `ANTHROPIC_API_KEY` if you want AI resume feedback, mock interviews,
   resume tailoring, and the career assistant to actually run in production
   (all of them degrade gracefully without it).
6. Optional: also on **Environment**, set `SMTP_HOST`/`SMTP_USER`/
   `SMTP_PASSWORD`/`SMTP_FROM` if you want "forgot password" to actually
   send an email (e.g. Gmail with an **App Password**, not your normal
   password). Without these, reset tokens are still created — there's just
   no way to deliver them to the user.
7. `startCommand` runs `alembic upgrade head` before starting the server —
   every deploy applies any pending schema migration automatically. See
   [architecture.md](architecture.md#database-migrations-alembic) if a
   deploy fails here; it almost always means a new migration wasn't written
   idempotently.

## 2. Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New** → **Project** → import the `OfferFlow` repo.
3. Set **Root Directory** to `frontend` (this is a monorepo — Vercel needs
   to know the app doesn't live at the repo root). Framework preset (Vite)
   is auto-detected.
4. Add an environment variable: `VITE_API_URL` = the Render URL from step 1
   (e.g. `https://offerflow-backend.onrender.com`). Vite bakes this in at
   build time, so it must be set *before* deploying, not after.
5. Deploy. Copy the resulting URL (e.g. `https://offerflow.vercel.app`).

## 3. Connect the two

Back on Render: open the backend service → **Environment** → update both
placeholder values to your actual Vercel URL from step 2:
- `CORS_ORIGINS` — without this, the browser blocks every request from the
  deployed frontend (CORS).
- `FRONTEND_URL` — used to build the link inside password-reset emails; if
  this is wrong, reset emails point at the wrong site.

Save — Render redeploys automatically.

## 4. Verify

Visit the Vercel URL, register an account, and click through
Dashboard → Resumes → Contacts. If login succeeds but every subsequent
request comes back `401`, the cookie isn't making it cross-site — double
check `CORS_ORIGINS` matches the Vercel URL **exactly** (including
`https://`, no trailing slash) and that the backend's `ENV` var is
`production` (set in `render.yaml`) so the session cookie uses
`SameSite=None; Secure` — see [architecture.md](architecture.md).

## Known limitations of this setup

- **Resume uploads are not durable.** Files are saved to the Render web
  service's local disk (`backend/uploads/`), which is **ephemeral** — every
  redeploy or restart wipes it, even though the database rows referencing
  those files survive. Fine for a demo; before relying on this for real
  files, move to a Render persistent disk (paid) or S3-compatible storage.
- **Free-tier cold starts.** Render's free web services spin down after
  inactivity; the first request after idling can take 30-60 seconds to wake
  back up.
- **Free Postgres isn't permanent.** Render's free database tier has an
  expiration window — check Render's current pricing page if you want this
  environment to stay up long-term rather than being a temporary demo.
