# API Design

Base URL: `http://localhost:8000` (configurable on the frontend via `VITE_API_URL`).

## Authentication

All `/applications` endpoints require a logged-in session, sent as an
httpOnly `access_token` cookie (set automatically by `/auth/register` and
`/auth/login`). Requests without a valid cookie get `401`.

### `User`

```jsonc
{
  "id": 1,
  "email": "student@example.com",
  "created_at": "2026-08-27T05:30:55.214358+00:00"
}
```

| Method | Path            | Body                          | Response         | Notes |
|--------|-----------------|--------------------------------|-------------------|-------|
| POST   | `/auth/register`| `{ "email", "password" }`      | `User` (201)      | Sets the session cookie. `400` if email already registered. `password` min length 8. |
| POST   | `/auth/login`   | `{ "email", "password" }`      | `User`            | Sets the session cookie. `401` on bad credentials. |
| POST   | `/auth/logout`  | —                               | — (204)           | Clears the session cookie. |
| GET    | `/auth/me`      | —                               | `User`            | `401` if not logged in. |

## `Application`

```jsonc
{
  "id": 1,
  "company": "Google",
  "role": "Software Engineering Intern",
  "date_applied": "2026-06-18",     // ISO date string
  "status": "Applied",              // one of the statuses below, or a custom string
  "referral_used": true,
  "contact_person": "John Smith",   // nullable
  "job_description": "...",         // nullable
  "match_score": 7,                 // nullable, 0-10
  "strengths": ["Python", "React"],
  "weaknesses": ["System design"],
  "notes": "Need to follow up.",    // nullable
  "created_at": "2026-08-27T05:30:55.214358+00:00",
  "updated_at": "2026-08-27T05:30:55.214364+00:00"
}
```

### Standard statuses
`Applied`, `Online Assessment`, `Recruiter Screen`, `Technical Interview`,
`Final Round`, `Offer`, `Rejected` — the frontend suggests these but the
`status` field accepts any string, so custom statuses are supported.

## Endpoints

| Method | Path                    | Body                | Response              | Notes |
|--------|-------------------------|----------------------|------------------------|-------|
| GET    | `/applications`         | —                    | `Application[]`        | Newest first |
| POST   | `/applications`         | `ApplicationCreate`  | `Application` (201)    | |
| GET    | `/applications/{id}`    | —                    | `Application`          | 404 if missing or owned by another user |
| PATCH  | `/applications/{id}`    | `ApplicationUpdate`  | `Application`          | All fields optional; only sent fields are updated |
| DELETE | `/applications/{id}`    | —                    | — (204)                | 404 if missing or owned by another user |

All endpoints operate only on the authenticated user's own applications
(`user_id` is set from the session, never accepted from the client).

`ApplicationCreate` requires `company`, `role`, `date_applied`; everything
else has a default (`status: "Applied"`, `referral_used: false`, empty
lists/nulls). `ApplicationUpdate` makes every field optional for partial
updates (e.g. just `{"status": "Offer"}`).
