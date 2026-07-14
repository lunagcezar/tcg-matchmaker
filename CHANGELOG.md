# Changelog

All notable changes to this project will be documented in this file.

## [0.0.0] — 2026-07-14

### Added

- Project initialization
- Stack decision: Quasar (Vue 3 + Vite) + Hono (Cloudflare Workers) + Supabase (Postgres + Auth)
- Architecture planning documents:
  - `docs/data-model.md` — Entity definitions for Users, TCGs, Formats, Game Stores, Matches, Tournaments, Brackets
  - `docs/requirements.md` — Functional and non-functional requirements
  - `docs/use-cases.md` — 20 use cases covering all user roles
  - `docs/pages.md` — Route map and component organization
  - `AGENTS.md` — Project conventions and AI-assisted development guide
- Skills added to `.agents/skills/`:
  - test-driven-development
  - tdd
  - supabase
  - supabase-postgres-best-practices
  - create-specification
  - brainstorming
  - frontend-design
  - design-taste-frontend
  - cloudflare, wrangler, workers-best-practices
  - agents-sdk, durable-objects
  - cloudflare-email-service, turnstile-spin
  - web-perf, code-review, code-simplifier, security-review
  - agents-md, skill-writer
  - sandbox-sdk

### Changed

- Supabase API keys: replaced `service_role`/`anon` (JWT, legacy) with **secret key** (`sb_secret_...`) for Hono Workers and **publishable key** (`sb_publishable_...`) for frontend auth. Auth flow updated accordingly.
- LGPD compliance improvements:
  - Account deletion now permanently removes Supabase Auth user (email erased); same email can be re-registered
  - Added data export (portability), consent recording, account suspension
  - Custom SMTP via **Resend** for transactional emails (avoids Supabase suspension risk)
  - Security: Turnstile CAPTCHA on signup, KV rate limiting, account locking after failed attempts
- Observability: Sentry for error tracking, centralized structured logger with LGPD sanitization
- Store registration: self-submit with admin review (status: pending/approved/rejected)
- Added tools to stack: VueUse, hono/client, Zod, Luxon, @vue/test-utils, MSW
- Added: Supabase Realtime, Cloudflare KV, ESLint + Prettier + Husky, Supabase CLI
