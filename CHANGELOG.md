# Changelog

All notable changes to this project will be documented in this file.

## [0.10.0] — 2026-07-14

### Added

- Implemented spec-010: Geocoding API (TDD)
  - `GET /api/geocode/search?q=` — proxy Nominatim autocomplete search with KV cache (24h TTL)
  - `GET /api/geocode/reverse?lat=&lng=` — proxy Nominatim reverse geocoding with KV cache
  - KV caching: cached flag in response meta, avoids repeated Nominatim calls
  - Proper error handling: 400 for missing params, 502 for upstream failures
  - Nominatim usage policy: User-Agent header set via env
  - 6 new tests (TDD RED → GREEN), 40 total passing

## [0.9.0] — 2026-07-14

### Added

- Implemented spec-009: code quality — DRY test utilities & no-any rule
  - Extracted shared test utilities into `src/test-utils/supabase.ts`: `chain()`, `makeApp()`, `authMock()`, `userChain()`, `makeUser()`, `env`, `testUserId`
  - Removed all duplicate `chain`/`chainBuilder`/`authMock`/`makeApp` functions from test files
  - Removed old `test-utils/mocks.ts` and `test-utils/helpers.ts`
  - No `as any` in production code (verified across all worker source files)
- AGENTS.md: added explicit "No `any` types" rule in Code Quality section

### Changed

- All 7 test files refactored to import shared utilities from `src/test-utils/supabase.ts`
- Test files use `as ReturnType<typeof vi.fn>` casts instead of `as any`

## [0.8.0] — 2026-07-14

### Added

- Implemented spec-008: Tournaments API (TDD)
  - Tournament CRUD: create (draft), list, get, update, publish (→open), cancel
  - Registration: register (pending), check-in (organizer)
  - Start tournament: single-elimination bracket generation (rounds + matches with next_match advancement)
  - Bracket queries: get rounds + matches
  - Match reporting: report result (advances winner), walkover (W.O.)
  - Fixed bracket generation float index bug in nextMatchIndex calculation
  - 5 new tests (TDD RED → GREEN), 34 total passing

## [0.7.0] — 2026-07-14

### Added

- Implemented spec-007: Events API — Matches & Trading Sessions (TDD)
  - Event CRUD: list (with filters), get (with participant count), create, update, cancel
  - Participant management: join (match only), confirm, decline, list
  - Status defaults: `open` for matches, `planned` for trading sessions
  - Creator-only guards for update/cancel; join validations (not own event, not full, not duplicate)
  - 6 new tests (TDD RED → GREEN), 29 total passing

## [0.6.0] — 2026-07-14

### Added

- Implemented spec-006: Game Stores API (TDD)
  - Store routes: list (public), get (public), create (auth), update (owner/manager), soft-delete (admin)
  - Store memberships: list (owner/manager), add (owner/manager), remove member (owner, last-owner protection)
  - Admin operations: verify store, suspend store with reason
  - Auto-generated slug from store name on creation
  - Owner auto-assigned on store creation, rollback on membership failure
  - Created shared `chainBuilder` test utility for Supabase mock chains
  - 6 new tests, 23 total, all passing (TDD: RED → GREEN)

## [0.5.0] — 2026-07-14

### Added

- Implemented spec-005: test backfill & TDD infrastructure
  - Vitest configuration for worker package
  - Test utilities: mock data factories, Supabase mock helper
  - Auth middleware tests: 6 cases (missing header, invalid token, banned, deleted, valid user)
  - Admin middleware tests: 2 cases (403 non-admin, pass for admin)
  - Auth route tests: 4 cases (onboarding with/without admin, me authenticated/not)
  - TCG route tests: 5 cases (list, 401, 403, create, soft-delete)

### Changed

- Moved test utilities inside `src/` for tsconfig compatibility
- Established testing patterns (Hono `app.request()`, `vi.mock` for Supabase)

## [0.4.0] — 2026-07-14

### Added

- Implemented spec-004: TCGs & Formats API
  - Admin middleware (`middleware/admin.ts`) — role check, returns 403 for non-admins
  - Updated shared schemas: `UpdateTcgSchema`, `UpdateFormatSchema`
  - `GET /api/tcgs` — list non-deleted TCGs (public)
  - `GET /api/tcgs/:id` — get TCG by ID (public)
  - `POST /api/tcgs` — create TCG (admin)
  - `PATCH /api/tcgs/:id` — update TCG (admin)
  - `DELETE /api/tcgs/:id` — soft-delete TCG (admin)
  - `GET /api/tcgs/:tcgId/formats` — list formats for a TCG (public)
  - `POST /api/tcgs/:tcgId/formats` — create format (admin)
  - `PATCH /api/formats/:id` — update format (admin)
  - `DELETE /api/formats/:id` — soft-delete format (admin)

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
