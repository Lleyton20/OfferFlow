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
  "resume_id": 3,                   // nullable — which uploaded resume was used
  "created_at": "2026-08-27T05:30:55.214358+00:00",
  "updated_at": "2026-08-27T05:30:55.214364+00:00",
  "status_history": [
    { "id": 1, "status": "Applied", "created_at": "2026-06-18T09:00:00+00:00" },
    { "id": 2, "status": "Recruiter Screen", "created_at": "2026-06-25T14:30:00+00:00" }
  ]
}
```

### Standard statuses
`Applied`, `Online Assessment`, `Recruiter Screen`, `Technical Interview`,
`Final Round`, `Offer`, `Rejected` — the frontend suggests these but the
`status` field accepts any string, so custom statuses are supported.

### Status history
`status_history` is append-only and read-only via this API — there's no
endpoint to edit or delete an entry. A new event is recorded automatically
whenever `PATCH .../status` actually changes the value (setting it to the
same value again does not add a duplicate entry), plus one initial event at
creation time. It's how [docs/architecture.md](architecture.md)'s "Career
Analytics" and the frontend's History page reconstruct a timeline without a
separate audit-log feature.

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

## `Resume`

```jsonc
{
  "id": 1,
  "filename": "resume.pdf",
  "job_description": "Looking for an intern...",  // nullable — only if pasted at upload time
  "ats_score": 65,                                 // 0-100
  "ats_checks": [
    { "check": "Contact info", "passed": true, "detail": "Email address found." },
    { "check": "Keyword match", "passed": true, "detail": "Matched 3 of 6 keywords from the job description." }
  ],
  "matched_keywords": ["intern", "python", "react"],
  "missing_keywords": ["experienced", "sql"],
  "ai_feedback": {                                 // null if ai_feedback_status != "ok"
    "overall_summary": "...",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "suggestions": ["..."]
  },
  "ai_feedback_status": "ok",                      // "ok" | "not_configured" | "error"
  "created_at": "2026-08-27T05:30:55.214358+00:00"
}
```

### Endpoints

| Method | Path              | Body                                            | Response         | Notes |
|--------|-------------------|--------------------------------------------------|-------------------|-------|
| GET    | `/resumes`        | —                                                 | `Resume[]`        | Newest first |
| POST   | `/resumes`        | multipart: `file` (PDF or `.txt`) + optional `job_description` | `Resume` (201) | `400` on unsupported file type, file > 5MB, or no extractable text |
| GET    | `/resumes/{id}`   | —                                                 | `Resume`          | 404 if missing or owned by another user |
| DELETE | `/resumes/{id}`   | —                                                 | — (204)           | 404 if missing or owned by another user; also deletes the stored file |

ATS scoring is deterministic and rule-based (no AI call): contact info,
quantifiable achievements, resume length, standard section headers, and —
only when `job_description` is provided — keyword overlap between the resume
and the job description.

AI feedback (`ai_feedback` + `ai_feedback_status`) calls Claude and degrades
gracefully: `"not_configured"` when no Anthropic credentials are set on the
backend (the resume is still scored and saved), `"error"` on a transient API
failure, `"ok"` with the populated `ai_feedback` object otherwise.

## `Contact`

```jsonc
{
  "id": 1,
  "name": "Alex Recruiter",
  "company": "Netflix",                 // nullable
  "role": "Technical Recruiter",        // nullable
  "email": "alex@netflix.com",          // nullable
  "linkedin_url": "https://linkedin.com/in/alexrecruiter",  // nullable
  "relationship_type": "Recruiter",     // suggested: Recruiter, Hiring Manager, Referral, Alum, Other — or custom
  "notes": "Met at career fair.",       // nullable
  "last_contacted_date": "2026-08-01",  // nullable, ISO date string
  "follow_up_date": "2026-09-01",       // nullable, ISO date string
  "created_at": "2026-08-27T05:30:55.214358+00:00",
  "updated_at": "2026-08-27T05:30:55.214364+00:00",
  "interactions": [
    { "id": 1, "date": "2026-08-15", "note": "Coffee chat about the team.", "created_at": "..." }
  ]
}
```

### Endpoints

| Method | Path                                      | Body                              | Response         | Notes |
|--------|-------------------------------------------|-------------------------------------|-------------------|-------|
| GET    | `/contacts`                                | —                                    | `Contact[]`       | Newest first, `interactions` included |
| POST   | `/contacts`                                | `ContactCreate`                      | `Contact` (201)   | Only `name` is required |
| GET    | `/contacts/{id}`                           | —                                    | `Contact`         | 404 if missing or owned by another user |
| PATCH  | `/contacts/{id}`                           | `ContactUpdate`                      | `Contact`         | All fields optional |
| DELETE | `/contacts/{id}`                           | —                                    | — (204)           | Also deletes its interactions (cascade) |
| POST   | `/contacts/{id}/interactions`              | `{ "date", "note" }`                 | `Interaction` (201) | |
| DELETE | `/contacts/{id}/interactions/{interaction_id}` | —                                 | — (204)           | 404 if the contact or interaction isn't the caller's |

"Networking analytics" (total contacts, overdue follow-ups, breakdown by
relationship type) isn't a separate endpoint — the frontend computes it from
the `GET /contacts` response it already has.
