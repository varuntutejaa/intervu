# Intervu

AI-assisted job platform connecting candidates and recruiters — resume-driven job matching, a two-sided application pipeline, and a single account that can hold both a candidate and a recruiter identity at once.

[![Deploy Backend](https://github.com/varuntutejaa/intervu/actions/workflows/deploy.yml/badge.svg)](https://github.com/varuntutejaa/intervu/actions/workflows/deploy.yml)
[![Deploy Frontend](https://github.com/varuntutejaa/intervu/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/varuntutejaa/intervu/actions/workflows/deploy-frontend.yml)

**Live app:** [d2sbflfh62ti4k.cloudfront.net](https://d2sbflfh62ti4k.cloudfront.net)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)

---

## Overview

Intervu is a full-stack job platform with two distinct experiences behind one login system:

- **Candidates** build a profile, browse open roles, and apply — with duplicate-application protection and a real applications dashboard.
- **Recruiters** post jobs (auto-assigned a 6-digit reference code), browse every candidate who's set up a profile, and see exactly who applied to each posting.
- **One account, both roles.** A person can hold a candidate profile and a recruiter profile simultaneously and switch between them from the navbar — no second signup, no second email required.

## Features

**Auth**
- Email/password via AWS Cognito (email verification flow included)
- Google and GitHub sign-in via direct OAuth 2.0 (no third-party auth service in the loop)
- Session-based auth (httpOnly cookies), not JWT-in-localStorage
- Role-aware login: signing in as the wrong role for an account routes you to set that role up, rather than silently logging into the wrong context

**Candidates**
- Guided profile setup (desired role, experience, skills, portfolio, resume, bio, avatar)
- Job board with job type / work mode / experience / salary filters visible per listing
- One-click apply with a full job-detail view (description, skills, deadline)
- Applications dashboard showing status per application

**Recruiters**
- Post a job with structured fields (type, mode, experience, salary range, skills, deadline) — auto-assigned a shareable 6-digit reference code
- Recruiter dashboard listing every job they've posted
- Per-job applicant view — every candidate who applied, with their full profile
- Browse all candidates platform-wide

**Platform**
- Dual-role accounts with an explicit "Switch to Recruiter/Candidate" action
- Profile pictures and company logos (stored inline, capped client-side)
- Consistent dark UI with a shared design system across every page

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (AWS RDS) |
| Auth | AWS Cognito (email/password) + direct Google/GitHub OAuth |
| Hosting — frontend | AWS S3 (private) behind AWS CloudFront |
| Hosting — backend | AWS EC2 (Ubuntu) + Nginx reverse proxy + PM2 |
| CI/CD | GitHub Actions (separate backend/frontend deploy workflows) |

## Architecture

```mermaid
flowchart LR
    Browser -->|HTTPS| CF[CloudFront]
    CF -->|"/*"| S3[(S3 — static build)]
    CF -->|"/api/*"| EC2[EC2: Nginx to PM2 to Express]
    EC2 --> RDS[(RDS Postgres)]
    EC2 --> Cognito[AWS Cognito]
    EC2 --> Google[Google OAuth]
    EC2 --> GitHub[GitHub OAuth]
```

Frontend and backend are served from the **same CloudFront domain** — CloudFront routes `/api/*` to the EC2 backend and everything else to the S3-hosted static build. That means no CORS configuration and no mixed-content issues in production, and session cookies work exactly the same way as they do in local dev (where Vite's dev server proxies `/api` to the backend instead).

## Project structure

```
backend/src/
  index.ts            # Express app entry point
  routes/              # One file per resource: auth, oauth, profile, jobs, candidates, applications
  middleware/           # asyncHandler, requireRole
  lib/                  # db pool, Cognito client, JWT decode, profile-role helpers

frontend/src/
  App.tsx              # Client-side router / route table
  main.tsx, index.css  # Entry point, global styles
  pages/                # One file per route (Login, Signup, Jobs, Profile, RecruiterDashboard, ...)
  components/           # Shared UI: AuroraLayout (design system), LandingChrome (navbar), ProfileFields
  lib/                  # router.ts — minimal pathname-based router

infra/                  # CloudFront distribution config + S3 bucket policy (reference/reproducibility)
.github/workflows/       # deploy.yml (backend to EC2), deploy-frontend.yml (S3 + CloudFront)
```

## Getting started

**Prerequisites:** Node.js 20+, a PostgreSQL database (AWS RDS or local), an AWS Cognito User Pool.

**Backend**

```bash
cd backend
cp .env.example .env     # fill in RDS + Cognito + OAuth credentials — see below
npm install
node scripts/init-db.mjs # creates the database (if missing) and applies schema.sql
npm run dev               # http://localhost:3001
```

**Frontend**

```bash
cd frontend
npm install
npm run dev               # http://localhost:5174, proxies /api to the backend
```

Both servers need to be running locally — the frontend has no build-time environment variables of its own; everything (including OAuth) is driven server-side.

## Environment variables

All backend configuration lives in `backend/.env` (see `backend/.env.example` for the full annotated list). Nothing is required on the frontend.

| Variable | Purpose |
|---|---|
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` (or `DATABASE_URL`) | Postgres connection |
| `DB_SSL` | Set `true` for RDS (default) |
| `PORT` | Backend listen port (default `3001`) |
| `CORS_ORIGIN` | Allowed frontend origin for CORS |
| `PUBLIC_URL` | The externally-reachable origin the app is served from — used to build OAuth redirect URIs and the post-login redirect target |
| `COGNITO_REGION`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET` | Cognito User Pool app client |
| `SESSION_SECRET` | Random string signing the session cookie |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth App |

## API reference

All routes are mounted under `/api`. Session-authenticated routes read a session cookie set at login; role-gated routes 403 if the account doesn't have that profile.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | Create a Cognito account, sends a verification code |
| POST | `/auth/confirm` | — | Confirm the verification code |
| POST | `/auth/resend-code` | — | Resend the verification code |
| POST | `/auth/login` | — | Email/password login |
| GET | `/auth/google/start`, `/auth/github/start` | — | Kick off OAuth redirect |
| GET | `/auth/google/callback`, `/auth/github/callback` | — | OAuth callback, establishes session |
| POST | `/auth/logout` | Session | Destroy session |
| GET | `/auth/me` | Session | Current user, active role, and all roles the account has |
| POST | `/auth/switch-role` | Session | Change which profile (candidate/recruiter) is active |
| GET | `/profile` | Session | Fetch the active (or `?role=`) profile |
| POST | `/profile` | Session | Create/update a profile for a given role |
| GET | `/jobs` | — | Public job listing |
| GET | `/jobs/mine` | Recruiter | Jobs posted by the current account |
| GET | `/jobs/:id/applicants` | Recruiter (owner) | Applicants for a specific job |
| POST | `/jobs` | Recruiter | Post a new job |
| GET | `/candidates` | Recruiter | Every candidate profile |
| GET | `/applications` | Candidate | The current account's applications |
| POST | `/applications` | Candidate | Apply to a job (idempotent) |
| GET | `/health` | — | Liveness check, verifies DB connectivity |

## Deployment

**Backend** — an EC2 instance runs the Express app under PM2 (auto-restarts on crash and on instance reboot via a systemd unit), with Nginx reverse-proxying port 80 to the app. `deploy.yml` SSHes in on every push to `main` touching `backend/**`, pulls, rebuilds, and restarts PM2.

**Frontend** — `deploy-frontend.yml` builds the Vite app and syncs it to a private S3 bucket on every push to `main` touching `frontend/**`, then invalidates the CloudFront cache. The S3 bucket has no public access — it's only reachable through CloudFront via an Origin Access Control.

Both workflows also support manual runs via `workflow_dispatch` from the Actions tab.

## Security notes

- Passwords never touch the application layer — Cognito is the sole system of record for them
- Session cookies are `httpOnly`; `secure` is enabled automatically in production
- Every database query is parameterized (no string-built SQL)
- Every ownership/role check is enforced server-side (e.g., a recruiter can only see applicants for jobs *they* posted; a candidate can only see their own applications)
- OAuth client secrets and the Cognito app secret never reach the frontend bundle

## Known limitations

- Resumes, company logos, and avatars are stored inline (base64/filename only) — no S3 object storage wired up for user uploads yet
- No rate limiting on auth endpoints beyond what Cognito enforces natively
- The EC2 instance is a single node — no load balancer or auto-scaling
