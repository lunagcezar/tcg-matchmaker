# AGENTS.md — TCG Matchmaker

## Project Overview

A community TCG (Trading Card Game) matchmaker platform. Users find and schedule matches at local game stores or custom locations, participate in tournaments, and organizers manage brackets. Focused initially on Fortaleza, Ceará, Brasil.

## Tech Stack

| Layer               | Technology                                  | Notes                                                                        |
| ------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| Frontend            | **Quasar** (Vue 3 + Vite + TypeScript)      | Responsive SPA, PWA-ready                                                    |
| State               | **Pinia**                                   | Global state (auth, app preferences)                                         |
| Utilities           | **VueUse**                                  | Composable utilities (geolocation, storage, debounce)                        |
| API                 | **Hono** on Cloudflare Workers              | Always warm, no cold starts                                                  |
| API client          | **Hono RPC** (`hono/client`)                | Fully typed client from Hono routes                                          |
| Validation          | **Zod**                                     | Schema validation for forms + API                                            |
| Database            | **Supabase** (PostgreSQL + PostGIS)         | Geospatial queries for nearby matches                                        |
| Auth                | **Supabase Auth**                           | JWT verified in Hono middleware                                              |
| Real-time           | **Supabase Realtime**                       | Live updates for RSVPs, match confirmations, bracket changes                 |
| Map                 | **Leaflet** + OpenStreetMap tiles           | Free map display                                                             |
| Bracket rendering   | **D3.js**                                   | Tree layouts for bracket visualization (single elim, double elim, pool play) |
| Geocoding           | **Nominatim** (proxied through Hono)        | Address autocomplete                                                         |
| Tests               | **Vitest** + **@vue/test-utils**            | Unit + integration + component tests                                         |
| Mocking             | **MSW**                                     | API mocking in tests                                                         |
| Date/time           | **Luxon**                                   | Timezone-aware date formatting                                               |
| Observability       | **Sentry**                                  | Error tracking with sanitized logging                                        |
| CI/CD               | Cloudflare Pages (frontend) + Workers (API) |                                                                              |
| Bot protection      | **Turnstile** (Cloudflare)                  | On signup form                                                               |
| Email               | **Resend** (custom SMTP)                    | Custom SMTP for Supabase Auth + app notifications                            |
| Cache/Rate limiting | **Cloudflare KV**                           | Rate limiting counters, geocoding cache                                      |

## Development Methodology

### Spec-Driven Development (SDD)

- All features are specified in `docs/` before implementation:
  - `docs/data-model.md` — Entities, relationships, columns
  - `docs/requirements.md` — Functional and non-functional requirements
  - `docs/use-cases.md` — User interaction flows
  - `docs/pages.md` — Route map and component structure
- Specifications follow the template in `.agents/skills/create-specification/SKILL.md`
- Workflow: **Spec → Plan → Tasks → Code → Commit**
  1. **Spec**: Write a numbered spec in `/spec/spec-NNN-purpose.md` using the template
  2. **Plan**: Generate `plan.md` in the same spec directory mapping requirements to technical decisions
  3. **Tasks**: Derive executable tasks from the plan, mark parallelizable items
  4. **Code**: Implement test-first following TDD discipline
  5. **Commit**: After all code is implemented and tests pass, commit with a conventional commit message scoped to the spec (e.g., `feat(worker): implement spec-001`) — see Commit Convention below
- Specs are saved in `/spec/` directory as `spec-NNN-purpose.md` where NNN is sequential (001, 002, etc.)
- Every spec includes acceptance criteria in Given-When-Then format
- Test scenarios are part of the spec, not written after implementation
- When requirements change, update the spec and regenerate the plan — code follows

### Test-Driven Development (TDD)

- **No production code without a failing test first.** (See `.agents/skills/test-driven-development/SKILL.md`)
- Red → Green → Refactor cycle for every feature and bug fix
- Tests use **Vitest**
- Tests verify behavior through public interfaces, not implementation details
- Mocks only when unavoidable (see `.agents/skills/tdd/mocking.md`)
- Before writing tests, agree on seams (test boundaries) with the human

### When Starting Work

1. Read `docs/requirements.md` and `docs/pages.md` to understand context
2. Read the relevant spec in `/spec/` if it exists
3. Consult skills in `.agents/skills/` for guidance
4. If updating the project, review docs and update them to reflect changes
5. Run `pnpm test` before and after every change

## Code Conventions

### SOLID & DRY

- Single Responsibility: each composable, component, and service does one thing
- Open/Closed: extend behavior via composables and middleware, not modification
- Dependency Inversion: composables accept their dependencies
- DRY is a first-class requirement: repeated logic is extracted into composables (`src/composables/`) or `lib/` utilities **before** it is duplicated across pages and components — extraction happens proactively, not as a follow-up

### Composables (Vue 3 Composition API)

- Stateful logic extracted to composables in `src/composables/`
- Named with `use` prefix: `useMatch`, `useGeolocation`, `useAuth`
- Return plain refs (not reactive objects) for destructuring
- Accept refs/getters when input should be reactive
- Clean up side effects in `onUnmounted`
- **DRY priority**: any logic repeated across two or more pages/components is extracted into a shared composable first — do not inline `save`, `loadMore`, `loadData`, or CRUD/pagination state in pages. Reuse the generic composables from `spec-077` (`useCrudResource`, `useFormSubmit`, `useLoadable`, `useParticipants`, `useStoreList`, `useTournamentBracket`) before writing new ones.
- Reusable stateful logic lives in `src/composables/` — not in `src/lib/` (pure functions only) and not in a `src/services/` folder
- See: https://vuejs.org/guide/reusability/composables.html

### Pinia Stores

- Global / shared state goes in Pinia stores under `src/stores/`
- Scaffold new stores with `quasar new store <name>` — creates the file with Quasar's `#q-app` import pattern automatically
- **Always use Pinia for shared state** — do not use bare `reactive()` or `ref()` outside components for global state
- `useAuthStore` — current user, session, login/logout
- `useAppStore` — theme (dark/light), language preference
- Feature-specific state belongs in composables (`src/composables/`), not stores
- Access the router in stores via `this.router`
- Destructure state/getters with `storeToRefs()` for reactivity in templates
- See: https://pinia.vuejs.org/api/

### Component Structure (Atomic Design)

```
src/components/
  atoms/           — Smallest building blocks (AppButton, AppCard, AppSection, AppAvatar, AppBadge, AppIcon, StatusBadge)
  molecules/       — Composed atoms with a single purpose
    fields/        — Form inputs (TextField, SelectField, LocationAutocomplete, DateTimePicker)
    cards/         — Entity cards (EventCard, UserCard, StoreCard)
    navigation/    — Nav components (MainNavigation, AdminNavigation)
    dialogs/       — Reusable dialogs (ConfirmDeleteDialog)
    filters/       — Filter controls (FilterToggle, StatusFilterSegment)
    rows/          — Reusable row wrappers (EventRow)
  organisms/       — Feature-specific sections composed of molecules + atoms
      home/          — BaseList, EventMap, EventFeed, FilterBar, GeolocateButton
    match/         — MatchCreateForm, ParticipantConfirmList
    trading/       — TradingCreateForm, AttendeeList, RsvpButton
    tournament/    — TournamentManageHeader, ParticipantListSection, BracketMatchSection, BracketView, ParticipantRegisterList
    settings/      — ProfileSettingsSection, PasswordSettingsSection, DangerZoneSection
    admin/         — TcgForm, FormatList, UserBanDialog
```

- `src/layouts/` = Templates layer (MainLayout, AdminLayout)
- `src/pages/` = Pages layer (HomePage, MatchDetailPage)

Atom naming: prefix with `App` (AppButton, AppCard). Molecule/organism names are descriptive (LocationAutocomplete, BracketView).

### i18n

- Brazilian Portuguese (`pt-BR`) and English (`en-US`)
- Uses Quasar's i18n integration (vue-i18n under the hood)
- Translation files in `src/i18n/`
- Default: browser locale (`navigator.language`), user can switch (stored in Pinia + localStorage)
- All user-facing strings use `$t()` or `useI18n()` composable

### Code Quality

- **Oxlint** for linting, configured at the workspace root in `.oxlintrc.json`
  - Built-in `eslint`, `typescript`, and `vue` plugins; `no-unused-vars` warnings with `argsIgnorePattern: '^_'`; `typescript/consistent-type-imports` and `typescript/no-explicit-any` enforced
  - Runs from a single root config regardless of package; `.gitignore` patterns are respected automatically
  - Note: the built-in `vue` plugin covers `<script>` blocks only — Vue template directives are type-checked by `vue-tsc`, not linted
- **Oxfmt** for formatting, configured at the workspace root in `.oxfmtrc.json`
  - Prettier-compatible style (single quotes, trailing commas, 100 print width); migrated from the former `.prettierrc`
  - Ignore patterns migrated from `.prettierignore` (agent skills, lockfiles, generated dirs)
- **Husky** + **lint-staged** — pre-commit hook runs `oxlint --fix` + `oxfmt --write` on staged files only; prevents broken commits
- **No `any` types** — never use `any` in production code. Use `unknown`, proper types, or Zod schemas instead. In tests, prefer `as Type` assertions over `as any`. Configure TypeScript with `strict: true` to enforce this.

### Frontend DRY & Quality Guidelines

These rules were introduced by the P1 audit remediation (`spec-070`) and are enforced by code review.

- **Page size ceiling**: Pages must stay ≤ 200 lines. If a page grows past ~150 lines, split the remaining markup into organisms under `src/components/organisms/<feature>/`.
- **Composable DRY**: Reuse the generic data-flow composables from `spec-077` (`useCrudResource`, `useFormSubmit`, `useLoadable`, `useParticipants`, `useStoreList`, `useTournamentBracket`) instead of re-implementing `save`/`loadMore`/`loadData`/pagination inline in pages. Repeated stateful logic is extracted into `src/composables/` as a first-class step (see the Composables section), never left duplicated.
- **Reusable list components**: All event feeds must use `BaseList` + `EventRow`. Do not re-create `.event-row` markup or `.q-infinite-scroll` wiring in individual pages.
- **Reusable filter components**: Use `StatusFilterSegment` for any status filter bar; do not duplicate inline filter segments.
- **Status display**: Use the `StatusBadge` atom for all status labels (events, admin tables, users). Keep the atom's color/status map up to date when adding a new status.
- **Destructive actions**: Use `ConfirmDeleteDialog` (or a generic confirmation dialog) for delete, ban, suspend, and walkover confirmations.
- **Date and time inputs**: Use the `DateTimePicker` molecule for any combined date/time input; do not wire separate Quasar date + time inputs directly in pages.
- **Date formatting**: Use `useFormatDate` (Luxon-based) for all displayed dates/times. Do not call `new Date().toLocaleDateString()` or `toLocaleTimeString()` directly.
- **i18n completeness**: Every user-facing string must be served by `$t()` or `useI18n()`. Add the key to both `en-US` and `pt-BR` files. Missing keys in tests are a warning to be fixed, not ignored.
- **Shared layout refs**: When a component needs access to a DOM ref owned by a layout (e.g., an infinite-scroll scroll target), the layout provides it via `provide(...)` and the component injects it via `inject(...)` from `src/lib/injectionKeys.ts`.
- **SSR/test-safe environment access**: Any code that reads `localStorage`, `navigator`, or `window` must guard against `undefined` so it works in Vitest/jsdom and any future SSR context.
- **Shared schemas**: Prefer Zod schemas from `@tcg/shared` for both frontend forms and Worker validation. Do not duplicate validation logic between frontend and backend.

## API Conventions

- All routes go through Hono Workers
- No direct Supabase DB access from the browser
- **Frontend**: uses Supabase Auth with **publishable key** (`sb_publishable_...`) — sign in/up only, never DB access
- **Hono Workers**: use **secret key** (`sb_secret_...`) for all DB operations (bypasses RLS — Supabase RLS warnings are expected and safe). The secret key replaces the legacy `service_role` JWT.
- Auth flow: frontend signs in via Supabase Auth → gets JWT → sends JWT in `Authorization: Bearer` header to Hono → Hono verifies JWT via `supabase.auth.getUser()` → Hono uses secret key for DB access
- Banned user check in Hono middleware
- **RLS is enabled on all tables as defense-in-depth** — Hono bypasses it via the secret key, but RLS blocks direct misuse of the publishable key against the DB endpoint
- Standard REST: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Response format: `{ data, error, meta }`
- **Worker DB client**: create the Supabase secret client exactly once per request in `src/middleware/db.ts` (`dbClientMiddleware`) and attach it to `c.var.db`. Routers and services read `c.var.db` instead of constructing `createSecretClient(...)` directly.
- **Worker response helpers**: build all `{ data, error, meta }` envelopes through `src/lib/responses.ts` (`ok`, `created`, `result`, `badRequest`, `notFound`, `forbidden`, `unauthorized`, `serverError`, `tooManyRequests`).
- **Worker validation helper**: validate incoming bodies with `validate(schema, body)` from `src/lib/validation.js`. Do not hand-format Zod error strings in services.
- **Shared constants**: user roles (`ROLES`, `Role`) and store membership roles (`STORE_MEMBERSHIP_ROLES`, `StoreMembershipRole`) live in `@tcg/shared`. Use them in both worker and frontend instead of string literals.
- **Frontend API calls**: use `apiGet`, `apiPost`, `apiPatch`, `apiDelete` from `@/composables/useApi` — typed fetch wrappers, NOT raw `fetch()` or Hono RPC client (Hono RPC types don't resolve across monorepo packages due to Cloudflare Worker bindings)
  - Always import from `@/composables/useApi`
  - Never import `hc` from `hono/client` directly
  - Cast response data at the assignment point with `as Record<string, unknown>[]` or similar
- Shared state lives in **Pinia stores** (`useEventStore`, `useStoreStore`, `useAuthStore`, `useAppStore`, `useNotificationStore`)
- Stateless API logic goes in **composables** or direct `api*` calls from stores
- Utility functions (formatting, colors, routing, locale detection) go in **`src/lib/`** — pure functions, no Vue reactivity

### Worker DRY & Quality Guidelines

These rules were introduced by the P0 audit remediation (`spec-069`) and are enforced by code review.

- **DB client once per request**: The secret Supabase client is created exactly once per request by `src/middleware/db.ts` (`dbClientMiddleware`) and attached to `c.var.db`. All routers and services read `c.var.db` and never call `createSecretClient(...)` directly.
- **Validation helper**: Use `validate(schema, body)` from `src/lib/validation.js` for all Zod parsing. Do not hand-format `parsed.error.issues` into strings in services.
- **Response helpers**: Build every `{ data, error, meta }` envelope through helpers in `src/lib/responses.ts` (`ok`, `created`, `badRequest`, `notFound`, `forbidden`, `unauthorized`, `tooManyRequests`, `serverError`). Do not construct `c.json(...)` response objects inline.
- **Shared constants**: Use `ROLES`/`Role` and `STORE_MEMBERSHIP_ROLES`/`StoreMembershipRole` from `@tcg/shared` for all role checks in both Worker and frontend. Do not use role string literals.
- **No `any` types**: Never use `any` in production code. Use `unknown`, proper types, or Zod schemas. Tests may use `as Type` assertions.
- **Raw fetch**: Frontend code must call the API through `apiGet`/`apiPost`/`apiPatch`/`apiDelete` from `@/composables/useApi`, never raw `fetch()`.
- **Regression tests**: Every bug fix must be accompanied by a regression test that fails before the fix and passes after.

## Docs Maintenance

- When implementing a feature, check if existing docs need updating
- If behavior changes, update the relevant `docs/*.md` file
- If new entities are added, update `docs/data-model.md`
- If new routes are added, update `docs/pages.md`
- If requirements change, update `docs/requirements.md`
- Log significant changes in `CHANGELOG.md`
- Always keep docs in sync with code

## Skills

This project has custom skills in `.agents/skills/`. Always consult the relevant skill before starting work:

| Skill                               | When to use                                        |
| ----------------------------------- | -------------------------------------------------- |
| `create-specification/SKILL.md`     | Before creating any spec document                  |
| `agents-md/SKILL.md`                | When creating or updating AGENTS.md                |
| `skill-writer/SKILL.md`             | When creating or updating skills                   |
| `test-driven-development/SKILL.md`  | Before writing any code (TDD cycle)                |
| `tdd/SKILL.md`                      | Additional TDD guidance (seams, anti-patterns)     |
| `supabase/SKILL.md`                 | When working with Supabase auth, DB, or storage    |
| `supabase-postgres-best-practices/` | When writing SQL migrations or queries             |
| `frontend-design/SKILL.md`          | When building UI components                        |
| `design-taste-frontend/SKILL.md`    | When making design decisions                       |
| `brainstorming/SKILL.md`            | When exploring solutions with the human            |
| `cloudflare/SKILL.md`               | General Cloudflare platform guidance               |
| `wrangler/SKILL.md`                 | Before running wrangler CLI commands               |
| `workers-best-practices/`           | When writing or reviewing Worker code              |
| `agents-sdk/SKILL.md`               | When building stateful agents or durable workflows |
| `durable-objects/SKILL.md`          | When using Durable Objects                         |
| `cloudflare-email-service/SKILL.md` | When sending or receiving emails                   |
| `turnstile-spin/SKILL.md`           | When setting up Turnstile CAPTCHA                  |
| `web-perf/SKILL.md`                 | When auditing or optimizing performance            |
| `code-review/SKILL.md`              | When performing code reviews                       |
| `code-simplifier/SKILL.md`          | When simplifying complex code                      |
| `security-review/SKILL.md`          | When auditing security                             |
| `sandbox-sdk/SKILL.md`              | When building sandboxed code execution             |

## External Documentation

Always fetch the latest documentation for the tools used in this project:

- Vue 3: https://vuejs.org/guide/introduction.html
- Quasar: https://quasar.dev/start/
- Pinia: https://pinia.vuejs.org/api/
- Hono: https://hono.dev/docs/
- Supabase: https://supabase.com/docs
- Vitest: https://vitest.dev/guide/
- VueUse: https://vueuse.org/guide/
- Leaflet: https://leafletjs.com/reference.html
- Luxon: https://moment.github.io/luxon/
- D3.js: https://d3js.org/api
- Zod: https://zod.dev/
- MSW: https://mswjs.io/docs/
- Vue Test Utils: https://test-utils.vuejs.org/guide/
- Supabase CLI: https://supabase.com/docs/guides/cli
- Cloudflare Workers: https://developers.cloudflare.com/workers/

Use `webfetch` to retrieve relevant pages when writing code that depends on framework APIs.

## Commit Convention

```
type(scope): description

types: feat, fix, docs, refactor, test, chore
scope: frontend, worker, spec, docs
```

## Technical Tips

### Project structure — monorepo with DDD worker

```
tcg-matchmaker/
  pnpm-workspace.yaml
  package.json                     # Root scripts (dev, test, lint, format) delegating via pnpm -F
  supabase/
    config.toml                    # Supabase CLI configuration
    migrations/                    # Database migrations (PostGIS, schema)
    seed.sql
  packages/
    shared/                        # Pure TS library — API contracts shared by frontend + worker
      package.json                 # @tcg/shared
      tsconfig.json
      src/
        schemas/                   # Zod schemas (used by both frontend forms and Worker validation)
          common.ts                # PaginationSchema, CursorSchema, ApiResponseSchema
          user.ts                  # SignupSchema, LoginSchema, ProfileSchema, UserSchema
          event.ts                 # CreateEventSchema, EventSchema, EventType, EventStatus
          store.ts                 # CreateStoreSchema, StoreSchema, StoreMembershipSchema
          tournament.ts            # CreateTournamentSchema, BracketSchema, BracketMatchSchema
          trading.ts               # CreateTradingSessionSchema, TradingSessionSchema
          notification.ts          # NotificationSchema, PushSubscriptionSchema
          report.ts                # ReportSchema, etc.
          geocoding.ts             # GeocodeQuerySchema, GeocodeResultSchema
        types/                     # Re-exported TS types derived from schemas
          index.ts
        constants.ts               # Enums and constants (event types, bracket types, roles, statuses)
        index.ts                   # Re-exports schemas, types, and constants
    frontend/                      # Quasar SPA
      package.json                 # @tcg/frontend — depends on @tcg/shared + @tcg/worker (types)
      src/
        pages/
        components/                # Atomic design (atoms / molecules / organisms / admin)
        lib/                       # Pure utility functions (format, colors, router, api)
        composables/               # useAuth, useMatch, useGeolocation, useTournament, …
        stores/                    # Pinia: useAuthStore, useAppStore, useEventStore, useStoreStore, useNotificationStore
        i18n/                      # en-US.ts, pt-BR.ts
        router/                    # Vue Router routes with auth guards
        boot/                      # Quasar boot files (supabase, sentry, turnstile)
    worker/                        # Hono API — organized by domain (DDD)
      package.json                 # @tcg/worker — depends on @tcg/shared
      wrangler.jsonc
      src/
        index.ts                   # Hono app bootstrap, CORS, error handling, middleware pipeline
        auth/                      # Signup, login, profile, delete account, data export
        events/                    # Matches + trading sessions (unified create, list, join, confirm)
        tournaments/               # Tournaments, brackets (generation, advancement, walkovers)
        stores/                    # Game stores CRUD, store memberships
        notifications/             # Notification CRUD, push subscriptions
        moderation/                # Reports, bans, suspensions, admin promotions
        geocoding/                 # Nominatim proxy + KV cache
        tcgs/                      # TCG + format CRUD
        middleware/                # auth (JWT verify + banned check), rate-limit (KV), logger, db client, …
        lib/                       # result/validation helpers, shared server-side utilities
        types/                     # Shared Hono Bindings / Variables types
        db/                        # Supabase client factory
        services/                  # Cross-domain business logic (if needed)
        test-utils/                # Test helpers (createTestApp, mock Supabase chain)
      test/                        # Vitest with @cloudflare/vitest-pool-workers
```

**Package dependency graph:**

```
frontend → shared
worker   → shared
frontend → worker (types only — hono/client)
```

The worker uses **domain-driven design** internally: each domain folder owns its routes, validators (Zod), service layer, and database queries. Cross-domain logic lives in `services/` or is accessed via function calls to another domain's service (no shared state).

### Hono RPC type sharing

`hono/client` requires the Worker to export route types. This means the worker package must be a dependency of the frontend package (type-only import). Package graph:

```
frontend → shared
worker → shared
frontend → worker (types only)
```

### CORS in Hono Worker

Configure CORS in Hono middleware to accept requests from the Cloudflare Pages domain and `localhost` during dev. Use the `hono/cors` middleware.

### Direct uploads to Supabase Storage

Avatar/logo uploads go **directly** from the frontend to Supabase Storage (using publishable key + RLS), not through the Worker. Workers have a 128MB memory limit — routing uploads through them wastes resources. The Worker validates file type/size after upload via a webhook or pre-signed URL check.

### PostGIS enablement

Supabase supports PostGIS but it must be explicitly enabled:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

This belongs in your first migration. Geospatial queries (`ST_DWithin`, `ST_MakePoint`) rely on it.

### Notifications — Realtime + table

In-app notifications use a `notifications` table + Supabase Realtime subscriptions. When an event changes (RSVP, challenge, bracket result), insert a notification row. Frontend subscribes to the user's notifications via Realtime and shows a badge.

### Bracket types

All five bracket types are implemented in the Worker (`packages/worker/src/tournaments/bracket-generators.ts`). The start route selects the correct generator based on `events.bracket_type`:

| Type                   | Generator                          | Strategy                                      |
| ---------------------- | ---------------------------------- | --------------------------------------------- |
| **Single elimination** | `generateSingleEliminationBracket` | Tree bracket, pair by seed                    |
| **Double elimination** | `generateDoubleElimination`        | Winners + losers brackets + grand final       |
| **Round robin**        | `generateRoundRobin`               | Circle method, every player vs every other    |
| **Swiss system**       | `generateSwiss`                    | Random pairing per round, configurable rounds |
| **Pool play**          | `generatePoolPlay`                 | Groups of 4 round-robin → knockout round      |

Selection at tournament creation via `q-select` with all five options.

Bracket visualization uses **D3.js** (`useBracketD3` composable) — SVG rendering with rounds as columns, match boxes with player names, winner highlighting, and connector lines. The ManagePage provides match result reporting (P1 Wins, P2 Wins, Walkover) for tournament organizers.

### Rate limiting

A KV-backed `rateLimitMiddleware` protects auth endpoints from abuse. Composite key strategy:

- **Authenticated routes**: keyed by `{userId}:{ip}` — prevents a game store's shared wifi IP from blocking all its customers. The user ID is auto-detected from `c.var.user.id` (set by `authMiddleware`).
- **Unauthenticated routes**: keyed by `{ip}` only — conservative limits (3/hour) mean normal users won't trigger it even behind NAT.

Factory: `rateLimitMiddleware(action, maxRequests, windowSeconds, userId?)`. KV key format: `ratelimit:{action}:{discriminator}`. See `packages/worker/src/middleware/rate-limit.ts`.

### Environment variables

Worker secrets via `wrangler secret put`:

- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `TURNSTILE_SECRET_KEY`
- `SENTRY_DSN`
- `NOMINATIM_USER_AGENT`

Frontend env via `.env` files:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_TURNSTILE_SITE_KEY`
- `VITE_SENTRY_DSN`
- `VITE_API_URL` (worker URL)

### API pagination

Use cursor-based pagination for the event feed (not offset). Cursors are stable when events are inserted mid-scroll. Query by `created_at` cursor + limit.

### Worker testing

Use `@cloudflare/vitest-pool-workers` for testing Hono routes in the actual Workers runtime. This catches Workers-specific issues that Node.js testing misses (no `fs`, limited globals).

### SEO & Discoverability (Hybrid Approach)

Do **not** use full Quasar SSR for this project. Use the following three-layer strategy:

1. **Quasar Meta plugin** — sets `<title>`, `<meta name="description">`, OpenGraph, Twitter Card, and JSON-LD tags client-side per route. This gives users correct browser tabs and satisfies social scrapers that execute JavaScript.
2. **Prerender static public routes** — prerender `/`, `/login`, `/signup`, `/stores`, and legal pages at build time for fast initial loads and basic crawler coverage.
3. **Dynamic rendering for crawlers** — implement a Cloudflare Worker (or Pages Function) that:
   - Detects crawler user-agents (Googlebot, Bingbot, etc.).
   - Calls the Hono API to fetch event/store/profile data.
   - Returns a minimal HTML shell containing the correct meta tags and JSON-LD.
   - Serves the normal SPA to non-crawler users.

Public detail pages (`/matches/:id`, `/tournaments/:id`, `/stores/:id`, `/profile/:username`) get their dynamic meta from this hybrid flow. Keep `robots.txt` and `/sitemap.xml` generated by a Worker at the edge. Ensure the `lang` attribute on `<html>` updates when the user switches locale.

## Available Commands

| Command                         | Description                                                         |
| ------------------------------- | ------------------------------------------------------------------- |
| `quasar dev`                    | Start frontend dev server                                           |
| `quasar build`                  | Build frontend for production                                       |
| `quasar new store <name>`       | Scaffold a new Pinia store                                          |
| `pnpm dev`                      | Start both Worker + frontend concurrently                           |
| `pnpm dev:e2e`                  | Start Worker + frontend + run Playwright tests                      |
| `pnpm test`                     | Run all Vitest tests (worker unit + frontend)                       |
| `pnpm test:coverage`            | Run frontend tests with V8 coverage + thresholds                    |
| `pnpm test:e2e`                 | Playwright auto-starts services, runs e2e tests                     |
| `pnpm lint`                     | Oxlint check across all packages                                    |
| `pnpm lint:strict`              | Oxlint with `suspicious`/`perf` as warnings (progressive hardening) |
| `pnpm lint:fix`                 | Oxlint check with `--fix` across all packages                       |
| `pnpm typecheck`                | `tsc`/`vue-tsc` across all packages                                 |
| `pnpm knip`                     | Find dead code / unused deps (see `knip.json`)                      |
| `pnpm format`                   | Oxfmt format across all packages                                    |
| `pnpm format:check`             | Oxfmt check across all packages                                     |
| `supabase start`                | Start local Supabase stack (Docker)                                 |
| `supabase stop`                 | Stop local Supabase                                                 |
| `supabase db diff`              | Generate migration from schema changes                              |
| `supabase gen types typescript` | Generate TypeScript types from DB                                   |
| `supabase db push`              | Push migrations to production                                       |
| `pnpm db:setup`                 | Reset local DB (migrations + seed) and create dev auth users        |
| `wrangler dev`                  | Start Worker locally                                                |
| `wrangler deploy`               | Deploy Worker to production                                         |
