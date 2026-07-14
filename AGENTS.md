# AGENTS.md — TCG Matchmaker

## Project Overview

A community TCG (Trading Card Game) matchmaker platform. Users find and schedule matches at local game stores or custom locations, participate in tournaments, and organizers manage brackets. Focused initially on Fortaleza, Ceará, Brasil.

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | **Quasar** (Vue 3 + Vite + TypeScript) | Responsive SPA, PWA-ready |
| State | **Pinia** | Global state (auth, app preferences) |
| Utilities | **VueUse** | Composable utilities (geolocation, storage, debounce) |
| API | **Hono** on Cloudflare Workers | Always warm, no cold starts |
| API client | **Hono RPC** (`hono/client`) | Fully typed client from Hono routes |
| Validation | **Zod** | Schema validation for forms + API |
| Database | **Supabase** (PostgreSQL + PostGIS) | Geospatial queries for nearby matches |
| Auth | **Supabase Auth** | JWT verified in Hono middleware |
| Real-time | **Supabase Realtime** | Live updates for RSVPs, match confirmations, bracket changes |
| Map | **Leaflet** + OpenStreetMap tiles | Free map display |
| Geocoding | **Nominatim** (proxied through Hono) | Address autocomplete |
| Tests | **Vitest** + **@vue/test-utils** | Unit + integration + component tests |
| Mocking | **MSW** | API mocking in tests |
| Date/time | **Luxon** | Timezone-aware date formatting |
| Observability | **Sentry** | Error tracking with sanitized logging |
| CI/CD | Cloudflare Pages (frontend) + Workers (API) | |
| Bot protection | **Turnstile** (Cloudflare) | On signup form |
| Email | **Resend** (custom SMTP) | Custom SMTP for Supabase Auth + app notifications |
| Cache/Rate limiting | **Cloudflare KV** | Rate limiting counters, geocoding cache |

## Development Methodology

### Spec-Driven Development (SDD)

- All features are specified in `docs/` before implementation:
  - `docs/data-model.md` — Entities, relationships, columns
  - `docs/requirements.md` — Functional and non-functional requirements
  - `docs/use-cases.md` — User interaction flows
  - `docs/pages.md` — Route map and component structure
- Specifications follow the template in `.agents/skills/create-specification/SKILL.md`
- Workflow: **Spec → Plan → Tasks → Code**
  1. **Spec**: Write a numbered spec in `/spec/spec-NNN-purpose.md` using the template
  2. **Plan**: Generate `plan.md` in the same spec directory mapping requirements to technical decisions
  3. **Tasks**: Derive executable tasks from the plan, mark parallelizable items
  4. **Code**: Implement test-first following TDD discipline
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
5. Run `npm test` before and after every change

## Code Conventions

### SOLID & DRY

- Single Responsibility: each composable, component, and service does one thing
- Open/Closed: extend behavior via composables and middleware, not modification
- Dependency Inversion: composables accept their dependencies
- DRY: extract repeated logic into composables and utility functions

### Composables (Vue 3 Composition API)

- Stateful logic extracted to composables in `src/composables/`
- Named with `use` prefix: `useMatch`, `useGeolocation`, `useAuth`
- Return plain refs (not reactive objects) for destructuring
- Accept refs/getters when input should be reactive
- Clean up side effects in `onUnmounted`
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
  atoms/           — Smallest building blocks (AppButton, AppCard, AppSection, AppAvatar, AppBadge, AppIcon)
  molecules/       — Composed atoms with a single purpose
    fields/        — Form inputs (TextField, SelectField, LocationAutocomplete)
    cards/         — Entity cards (EventCard, UserCard, StoreCard)
    navigation/    — Nav components (MainNavigation, AdminNavigation)
  organisms/       — Feature-specific sections composed of molecules + atoms
    home/          — EventMap, FilterPanel, EventList, GeolocateButton
    match/         — MatchCreateForm, ParticipantConfirmList
    trading/       — TradingCreateForm, AttendeeList, RsvpButton
    tournament/    — BracketView, ParticipantRegisterList
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

- **ESLint** with TypeScript rules and Quasar preset
- **Prettier** for consistent formatting (single quotes, trailing commas, 100 print width)
- **Husky** + **lint-staged** — pre-commit hook runs ESLint + Prettier on staged files only; prevents broken commits

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

| Skill | When to use |
|-------|-------------|
| `create-specification/SKILL.md` | Before creating any spec document |
| `agents-md/SKILL.md` | When creating or updating AGENTS.md |
| `skill-writer/SKILL.md` | When creating or updating skills |
| `test-driven-development/SKILL.md` | Before writing any code (TDD cycle) |
| `tdd/SKILL.md` | Additional TDD guidance (seams, anti-patterns) |
| `supabase/SKILL.md` | When working with Supabase auth, DB, or storage |
| `supabase-postgres-best-practices/` | When writing SQL migrations or queries |
| `frontend-design/SKILL.md` | When building UI components |
| `design-taste-frontend/SKILL.md` | When making design decisions |
| `brainstorming/SKILL.md` | When exploring solutions with the human |
| `cloudflare/SKILL.md` | General Cloudflare platform guidance |
| `wrangler/SKILL.md` | Before running wrangler CLI commands |
| `workers-best-practices/` | When writing or reviewing Worker code |
| `agents-sdk/SKILL.md` | When building stateful agents or durable workflows |
| `durable-objects/SKILL.md` | When using Durable Objects |
| `cloudflare-email-service/SKILL.md` | When sending or receiving emails |
| `turnstile-spin/SKILL.md` | When setting up Turnstile CAPTCHA |
| `web-perf/SKILL.md` | When auditing or optimizing performance |
| `code-review/SKILL.md` | When performing code reviews |
| `code-simplifier/SKILL.md` | When simplifying complex code |
| `security-review/SKILL.md` | When auditing security |
| `sandbox-sdk/SKILL.md` | When building sandboxed code execution |

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

### Project structure — monorepo with shared package

```
tcg-matchmaker/
  packages/
    shared/        — Zod schemas, types, constants (shared between frontend + worker)
    frontend/      — Quasar app
    worker/        — Hono API
```

Zod schemas for API requests/responses and shared types (Event, Participant, etc.) need to be imported by both frontend and worker. A shared package avoids duplication and keeps contracts in sync.

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

Flexible selection at tournament creation. Supported types (see [Brakto comparison](https://www.brakto.com/blog/tournament-format-comparison)):

- **Single elimination** — fastest, dramatic, lose once = out
- **Double elimination** — second chance, more accurate rankings
- **Round robin** — everyone plays everyone, most fair, best for small groups
- **Swiss system** — balanced matchups for large fields, standard for chess/MTG/esports
- **Pool play + playoffs** — group stage into knockout rounds, World Cup style

Swiss is particularly relevant for MTG (standard for competitive MTG tournaments). Implement all five bracket types; do not default to only single elimination.

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

## Available Commands

- `quasar dev` — Start development server
- `quasar build` — Build for production
- `quasar new store <name>` — Scaffold a new Pinia store
- `npm test` — Run Vitest
- `npm run lint` — ESLint check
- `npm run format` — Prettier format
- `supabase start` — Start local Supabase stack
- `supabase db diff` — Generate migration from schema changes
- `supabase gen types typescript` — Generate TypeScript types
- `wrangler dev` — Start local Workers development
- `wrangler deploy` — Deploy Workers to production
