# Development Roadmap

## Phase 1 — MVP ✅ done
Application Tracking System
- [x] Create applications
- [x] Edit applications
- [x] Delete applications
- [x] Status management (7 standard statuses + custom/free-text status)
- [x] Dashboard view (Kanban board grouped by status)

## Phase 2 — Authentication & User Accounts ✅ done
- [x] User registration
- [x] Login
- [x] Session management (JWT in an httpOnly cookie)
- [x] Protected routes (applications are now scoped per-user)

## Phase 3 — Resume Intelligence ✅ done
- [x] Resume uploads (PDF or plain text)
- [x] AI feedback (Claude, degrades gracefully without an API key)
- [x] ATS scoring (rule-based: contact info, quantifiable achievements, length, standard sections, keyword match against a pasted job description)
- [x] Resume version management (upload history, delete old versions)

## Phase 4 — Networking CRM ✅ done
- [x] Recruiter tracking (contacts with relationship type, company, role, email, LinkedIn)
- [x] Referral management (relationship type includes Referral; notes/conversation history per contact)
- [x] Follow-up reminders (per-contact follow-up date, overdue ones highlighted)
- [x] Conversation history (timestamped interaction log per contact)
- [x] Networking analytics (total contacts, overdue follow-ups, breakdown by relationship type)

## Phase 1.5 — Product Polish (V1 launch pass) ✅ done
- [x] Public landing page (marketing/hero page for signed-out visitors, at `/`; the
      dashboard moved to `/dashboard`)
- [x] Shared navigation shell (`AppHeader`) across Dashboard/Resumes/Contacts —
      replaces three copies of the same header, animated active-tab indicator
- [x] Cross-domain overview strip on the dashboard (active applications, offers,
      overdue follow-ups, latest resume score — each linking to its own page) so
      the three tools read as one connected product instead of three silos
- [x] Richer signup: full name and birthday are now required (birthday
      unlocks a small in-app birthday banner); university and expected
      graduation year are optional
- [x] Signed-in users are redirected away from `/`, `/login`, `/register`
      straight to `/dashboard`

## Phase 4.5 — Application History & Career Analytics ✅ done
- [x] Status history (every status change is recorded with a timestamp, not just
      the current status — shown as a timeline per application)
- [x] Application history list (`/history`) — every application ever created, in
      one chronological list with a job-description and status-timeline detail
      view, filterable by All / Active / Offers / Rejected
- [x] Resumes linked to applications — pick which uploaded resume was used for
      each application at create/edit time; shown on the board card and in history
- [x] Career analytics (`/analytics`) — offer rate, rejection rate, average resume
      score, applications-by-status breakdown, applications-over-time and
      resume-score trend charts, and a networking-effectiveness summary, all
      computed client-side from the existing `/applications`, `/resumes`, and
      `/contacts` endpoints (no new backend analytics endpoint)

## Phase 5 — Interview Preparation Suite ✅ done
- [x] Mock interview generation (Claude-generated questions + tips per role/interview
      type, using the linked application's role/company/job description when set;
      degrades gracefully without an API key, same pattern as resume AI feedback)
- [x] Study plans (per-session prep notes)
- [x] Behavioral question preparation (a static, filterable question bank — no AI
      call needed, always available)
- [x] Technical interview tracking (sessions optionally linked to a specific
      application, with type/status/scheduled date)
- [x] Interview performance history (1-5 star rating + reflection notes per
      session, rolled up into a summary tile on Analytics)

## Phase 6 — OfferFlow AI
- [ ] Career recommendations
- [ ] Job matching
- [ ] Personalized recruiting strategies
- [ ] AI-powered career assistant
