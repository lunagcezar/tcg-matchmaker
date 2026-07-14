# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] — 2026-07-14

### Added

- Implemented spec-003: complete database schema
  - Second Supabase migration with 12 tables: tcgs, formats, game_stores, store_memberships, events, event_participants, bracket_rounds, bracket_matches, notifications, push_subscriptions, reports, audit_log
  - All tables have RLS enabled, UUID PKs, FKs with appropriate ON DELETE behavior, CHECK constraints
  - Partial unique index on store_memberships to enforce one owner per store
  - Event organizer constraint (exactly one of organizer_user_id / organizer_store_id)
  - Shared package Zod schemas: tcg, store, event, tournament, notification, report
  - Types for all new domain entities

## [0.2.0] — 2026-07-14

### Added

- Implemented spec-002: auth system
  - `@supabase/supabase-js` dependency for Worker
  - Supabase client factory (`packages/worker/src/db/client.ts`) — secret key for DB, auth client for JWT verify
  - JWT verification + banned check middleware (`packages/worker/src/middleware/auth.ts`)
  - Auth API routes under `/api/auth`:
    - `GET /api/auth/onboarding` — check if admin exists
    - `POST /api/auth/onboarding` — create first admin
    - `GET /api/auth/me` — current user profile
    - `PATCH /api/auth/profile` — update display_name
    - `POST /api/auth/suspend` — suspend account
    - `POST /api/auth/export` — export personal data (LGPD)
    - `DELETE /api/auth/account` — delete account (with last admin protection)
  - Updated shared schemas: `OnboardingStatusSchema`, `UserResponseSchema`, `AccountActionResponseSchema`
  - All routes return consistent `{ data, error, meta }` envelope

## [0.1.0] — 2026-07-14

### Added

- Implemented spec-001: project infrastructure scaffolding
  - Root configs: `package.json`, `tsconfig.base.json`, `.prettierrc`, `.eslintrc.cjs`, `.gitignore`
  - `@tcg/shared` package: Zod schemas (`common.ts`, `user.ts`), types, constants
  - `@tcg/worker` package: Hono app skeleton with CORS, `wrangler.jsonc`, env template
  - `@tcg/frontend` package: Quasar SPA scaffolded with TypeScript, Pinia, ESLint, i18n, Sass — routes, stores, layouts, stub pages
  - `supabase/` config and initial migration (PostGIS + `public.users` + `public.consents` tables with RLS)
- SDD commit step: added `Commit` as step 5 in AGENTS.md workflow

### Changed

- AGENTS.md: SDD workflow extended from `Spec → Plan → Tasks → Code` to `Spec → Plan → Tasks → Code → Commit`

## [0.0.0] — 2026-07-14

### Added

- Project initialization
- Stack decision: Quasar (Vue 3 + Vite) + Hono (Cloudflare Workers) + Supabase (Postgres + Auth)
- Architecture planning documents:
  - `docs/data-model.md` — Entity definitions for Users, TCGs, Formats, Game Stores, Matches, Tournaments, Brackets
  - `docs/requirements.md` — Functional and non-functional requirements
  - `docs/use-cases.md` — 26 use cases covering all user roles
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
- Added tools to stack: VueUse, hono/client, Zod, Luxon, @vue/test-utils, MSW
- Added: Supabase Realtime, Cloudflare KV, ESLint + Prettier + Husky, Supabase CLI
- Added: Technical tips section in AGENTS.md (monorepo structure, Hono RPC, CORS, direct uploads, PostGIS, notifications, bracket types, env vars, pagination, worker testing)
- Added: `pool_play` bracket type (5 total: single elim, double elim, round robin, swiss, pool play)
- Added: D3.js for bracket visualization

### Changed

- Store model: replaced admin pre-approval with free store creation + moderation
  - Added `store_memberships` table with roles: owner, manager, staff
  - Store owner can transfer ownership; managers add staff; staff record results
  - Admin verifies stores (`is_verified`) and can suspend for impersonation
  - Added generic `reports` table for store/user/event reports
- Event organizer model: replaced `creator_id`/`creator_type` with `created_by_user_id` + `organizer_user_id` / `organizer_store_id`
- Participant confirmation flow: join/RSVP/register sets status `pending`; explicit confirmation moves to `confirmed`
- Tournament bracket advancement: added `next_match_id` and `next_match_player_slot` to `bracket_matches`
- Tournament walkover (W.O.): `bracket_matches.status` now includes `walkover`

### Added

- `consents` table for LGPD consent recording
- `notifications` table for Supabase Realtime in-app notifications
- Match result tracking via `event_participants.score` and `event_participants.placement`
- Data export returns JSON immediately (removed "within 24h" wording)
- Updated docs: `docs/data-model.md`, `docs/requirements.md`, `docs/use-cases.md` (now 36 UCs), `docs/pages.md`
- Added onboarding flow: `/onboarding` creates the first admin when no users exist; hidden once an admin exists
- Added admin promotion: only admins can promote users to admin
- Added last-admin deletion protection: the sole admin cannot delete their account until another admin is promoted
- Added browser push notifications (Web Push API) triggered by Supabase Realtime notification inserts
- Added event invitations: creators can invite registered users to matches, trading sessions, and tournaments
- Added SEO & discoverability requirements: semantic HTML, dynamic meta/OpenGraph/Twitter Cards, canonical URLs, `robots.txt`, `sitemap.xml`, JSON-LD, locale-aware `lang` attribute, hybrid approach (Quasar Meta + prerender + dynamic rendering for crawlers)
- Set pnpm as the default package manager; added `pnpm-workspace.yaml`

### Changed

- Updated project structure in docs and README to reflect full monorepo layout and domain-driven design in the Worker
