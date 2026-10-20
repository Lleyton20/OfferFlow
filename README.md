# OfferFlow

<div align="center">

### From Application to Offer.

An AI-powered career operating system that helps students and early-career professionals manage applications, prepare for interviews, track networking efforts, and optimize their job search journey.

[![CI](https://github.com/Lleyton20/OfferFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Lleyton20/OfferFlow/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.10+-0f7a45)](backend/pyproject.toml)
[![FastAPI](https://img.shields.io/badge/FastAPI-backend-0f7a45)](backend/)
[![React](https://img.shields.io/badge/React_19-frontend-0f7a45)](frontend/)

</div>

---

## Overview

The internship and new graduate recruiting process is fragmented.

Students often rely on multiple tools to manage their career development:

- LinkedIn for networking
- Job boards for applications
- Spreadsheets for tracking progress
- LeetCode for interview preparation
- AI tools for resume feedback
- Notes applications for recruiter conversations

OfferFlow centralizes these workflows into a single platform designed to help students stay organized, make informed decisions, and improve their chances of securing internships and full-time opportunities.

---

## Mission

To empower students with a modern, intelligent career management platform that transforms a chaotic job search into a structured and data-driven process.

---

## Problem Statement

A typical student may:

- Submit 100+ applications
- Network with dozens of recruiters
- Prepare for multiple technical interviews
- Manage referral requests
- Track deadlines across different companies

Most students currently manage this information using spreadsheets, notes applications, and disconnected tools.

OfferFlow provides a unified system for managing the entire recruiting pipeline from application to offer.

---

## Core Features

### Automatic Capture (browser extension)

Hit submit on Greenhouse, Lever, Ashby, Workday, LinkedIn, Indeed or a company
careers page and the application is saved to your board, with the role,
location, full job description and any recruiters or hiring managers the posting
lists. Duplicates are detected by job URL and by company and role. See
[extension/README.md](extension/README.md).

### Job Discovery & Alerts

Every 6 hours OfferFlow pulls fresh internships, new-grad roles and fellowships
from public sources: SimplifyJobs' community-maintained lists and companies'
own job boards on Greenhouse, Lever and Ashby. Openings are ranked for each user
against their interests, resume skills and application history, and every
recommendation explains why it was picked. A daily email digest sends new
matches (opt-out in settings).

### Application Tracking

Track applications throughout the recruiting lifecycle.

- Applied
- Online Assessment
- Recruiter Screen
- Technical Interview
- Final Round
- Offer
- Rejected

Features:

- Company tracking
- Role tracking
- Application deadlines
- Application notes
- Custom status updates

---

### Resume Intelligence

AI-powered resume analysis.

Features:

- Resume scoring
- ATS optimization suggestions
- Keyword matching
- Project recommendations
- Resume version management

---

### Networking CRM

Manage professional relationships and referrals.

Features:

- Recruiter tracking
- Referral tracking
- Conversation history
- Follow-up reminders
- Networking analytics

---

### Interview Preparation

Centralized interview preparation tools.

Features:

- Technical interview tracking
- Study plans
- Behavioral question preparation
- Mock interview generation
- Interview performance history

---

### Career Analytics

Measure progress throughout the recruiting process.

Features:

- Application conversion rates
- Interview success metrics
- Offer rates
- Networking effectiveness
- Job search insights

---

## System Architecture

```text
                 ┌─────────────┐
                 │   Frontend  │
                 │   React     │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │   FastAPI   │
                 │   Backend   │
                 └──────┬──────┘
                        │
        ┌───────────────┼───────────────┐
        ▼                               ▼

 ┌─────────────┐               ┌─────────────┐
 │ PostgreSQL  │               │ AI Services │
 │ Database    │               │ LLM APIs    │
 └─────────────┘               └─────────────┘
```

---

## Technology Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- React Query

### Backend

- FastAPI
- Python
- SQLAlchemy
- Pydantic

### Database

- PostgreSQL

### Infrastructure

- Docker
- GitHub Actions
- Railway / Render
- Vercel

### AI & Automation

- OpenAI API
- Anthropic API
- LangGraph (Future)
- Vector Search (Future)

---

## Development Roadmap

### Phase 1 — MVP

Application Tracking System

- Create applications
- Edit applications
- Delete applications
- Status management
- Dashboard view

### Phase 2

Authentication & User Accounts

- User registration
- Login
- Session management
- Protected routes

### Phase 3

Resume Intelligence

- Resume uploads
- AI feedback
- ATS scoring

### Phase 4

Networking CRM

- Recruiter tracking
- Referral management
- Follow-up reminders

### Phase 5

Interview Preparation Suite

- Mock interviews
- Study plans
- Performance tracking

### Phase 6

OfferFlow AI

- Career recommendations
- Job matching
- Personalized recruiting strategies
- AI-powered career assistant

---

## Project Structure

```text
offerflow/

├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── main.py
│   │
│   └── requirements.txt
│
├── docs/
│   ├── architecture.md
│   ├── roadmap.md
│   └── api-design.md
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## Getting Started

### With Docker (one command)

```bash
docker compose up --build
```

This starts Postgres, the API at `http://localhost:8000` (docs at `/docs`) and
the app at `http://localhost:5173`, with migrations applied automatically. AI
features and password-reset email are optional: copy `.env.example` to `.env`
and uncomment the keys you want to set.

### Without Docker

**Backend** (Python 3.10+)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                                # SQLite by default, no changes needed
alembic upgrade head
uvicorn app.main:app --reload --env-file .env
```

**Frontend** (Node 24)

```bash
cd frontend
npm install
cp .env.example .env                                # points at http://localhost:8000
npm run dev
```

### Quality checks

These are the same checks CI runs on every push and pull request.

| | Backend (`backend/`) | Frontend (`frontend/`) |
|---|---|---|
| Lint | `ruff check .` | `npm run lint` |
| Format | `ruff format --check .` | — |
| Types | `mypy` | `npm run typecheck` |
| Tests | `pytest --cov` | `npm test` |
| Build | — | `npm run build` |

Install the git hooks once with `pre-commit install` (from the repo root, with
the backend venv active) to run linting and formatting before every commit.

### Deploying

See [docs/deployment.md](docs/deployment.md) for the full guide — backend +
Postgres on Render, frontend on Vercel, both deploying straight from this
GitHub repo.

---

## Long-Term Vision

OfferFlow aims to become the operating system for career development by combining:

- Career Management
- Networking
- Recruiting Analytics
- AI Guidance
- Interview Preparation

into a single intelligent platform.

---

## Author

**Lleyton Magama**

Computer Science Student
Grambling State University

GitHub: https://github.com/lleyton

---

## Disclaimer

OfferFlow is an independent educational and portfolio project created for learning software engineering, full-stack development, system design, and AI integration principles.

This project is not affiliated with or endorsed by any recruiting platform, university, or employer.
