# TCG Matchmaker

A community platform for Trading Card Game (TCG) players to find and schedule matches, trading sessions, and tournaments at local game stores or custom locations.

Initially focused on **Fortaleza, Ceará, Brasil**.

## What it does

- **Matches**: create or join TCG matches (1v1, Commander pods, etc.) near you.
- **Trading sessions**: organize meetups to trade cards.
- **Tournaments**: create and manage tournaments with single/double elimination, round robin, Swiss, or pool play brackets.
- **Game stores**: create and manage local store pages, or submit stores for community discovery.
- **Real-time updates**: live notifications for RSVPs, confirmations, bracket changes, and moderation actions.

## Tech stack

| Layer             | Technology                                                                           |
| ----------------- | ------------------------------------------------------------------------------------ |
| Frontend          | [Quasar](https://quasar.dev/) (Vue 3 + Vite + TypeScript)                            |
| State             | [Pinia](https://pinia.vuejs.org/api/)                                                |
| Utilities         | [VueUse](https://vueuse.org/guide/) (geolocation, storage, debounce)                 |
| API client        | [Hono RPC](https://hono.dev/docs/guides/rpc) — fully typed client from Worker routes |
| API               | [Hono](https://hono.dev/) on Cloudflare Workers                                      |
| Database          | [Supabase](https://supabase.com/) (PostgreSQL + PostGIS + Auth + Realtime)           |
| Validation        | [Zod](https://zod.dev/)                                                              |
| Maps              | [Leaflet](https://leafletjs.com/) + OpenStreetMap                                    |
| Geocoding         | [Nominatim](https://nominatim.org/) (proxied through Hono)                           |
| Bracket rendering | [D3.js](https://d3js.org/api) — SVG bracket tree via `useBracketD3` composable       |
| Tests (unit)      | [Vitest](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/)     |
| Tests (e2e)       | [Playwright](https://playwright.dev/)                                                |
| Date/time         | [Luxon](https://moment.github.io/luxon/)                                             |
| Observability     | [Sentry](https://sentry.io/)                                                         |
| CI/CD             | Cloudflare Pages (frontend) + Workers (API)                                          |
| Bot protection    | [Turnstile](https://www.cloudflare.com/products/turnstile/)                          |
| Email             | [Resend](https://resend.com/) (custom SMTP)                                          |

The project is a monorepo organized with pnpm workspaces. The Hono API uses domain-driven design internally.

```
tcg-matchmaker/
  pnpm-workspace.yaml
  supabase/
    config.toml              # Supabase CLI config
    migrations/              # Database migrations
  packages/
    shared/                  # @tcg/shared — Zod schemas, types, constants
    frontend/                # @tcg/frontend — Quasar SPA
      src/
        pages/               # Page components
        components/          # Atomic design (atoms/molecules/organisms)
        composables/         # Vue composables
        stores/              # Pinia stores
        i18n/                # Translations (en-US, pt-BR)
        router/              # Vue Router
        boot/                # Quasar boot files
    worker/                  # @tcg/worker — Hono API
      src/
        index.ts             # App bootstrap + middleware pipeline
        auth/                # Signup, login, profile
        events/              # Matches + trading sessions
        tournaments/         # Tournaments + brackets
        stores/              # Game stores + memberships
        notifications/       # In-app + push notifications
        moderation/          # Reports, bans, admin actions
        geocoding/           # Nominatim proxy
        tcgs/                # TCG + format CRUD
        middleware/          # Auth, rate-limit, logger
        db/                  # Supabase client
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — required for local Supabase
- [Supabase CLI](https://supabase.com/docs/guides/cli) — for local database
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — for Worker

## Development setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — required for local Supabase
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `supabase start` requires Docker
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — for Worker development

### Quick start

```bash
# 1. Clone and install
git clone <repo-url>
cd tcg-matchmaker
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase project credentials

# 3. Start local Supabase
supabase start

# 4. Generate TypeScript types from local DB
supabase gen types typescript --local > packages/shared/src/database.types.ts

# 5. In separate terminals:
pnpm dev:worker    # Worker at http://localhost:8787
pnpm dev:frontend  # Frontend at http://localhost:9000
```

### Supabase local stack

The local Supabase stack provides PostgreSQL (with PostGIS), Auth, and Storage:

```bash
supabase start                    # Start all services
supabase stop                     # Stop all services
supabase db diff                  # Generate migration from schema changes
supabase gen types typescript     # Generate TypeScript types from DB
supabase db push                  # Push migrations to production
```

The local Supabase dashboard is available at `http://localhost:54323`.

### Running tests

```bash
pnpm test              # Worker unit tests (Vitest)
pnpm test:e2e          # E2E tests (Playwright — auto-starts frontend + Worker)
```

For E2E tests, ensure local Supabase is running (`supabase start`) and `.env` files are configured.

## Environment variables

### Frontend (`packages/frontend/.env`)

| Variable                        | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project URL                                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (used only for Auth)           |
| `VITE_TURNSTILE_SITE_KEY`       | Cloudflare Turnstile site key                           |
| `VITE_SENTRY_DSN`               | Sentry DSN for frontend error tracking                  |
| `VITE_API_URL`                  | Hono Worker URL (e.g., `http://localhost:8787` locally) |

### Worker (`packages/worker/.env`)

| Variable                   | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `SUPABASE_URL`             | Supabase project URL                             |
| `SUPABASE_SECRET_KEY`      | Supabase secret key (used for all DB operations) |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (used to verify JWTs)   |
| `RESEND_API_KEY`           | Resend API key for transactional emails          |
| `TURNSTILE_SECRET_KEY`     | Cloudflare Turnstile secret key                  |
| `SENTRY_DSN`               | Sentry DSN for backend error tracking            |
| `NOMINATIM_USER_AGENT`     | User agent for Nominatim geocoding requests      |

### Production secrets

Worker secrets are managed with Wrangler:

```bash
cd packages/worker
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SECRET_KEY
# ... repeat for each secret
```

Frontend env variables are provided at build time by Cloudflare Pages.

## Available commands

| Command                         | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `pnpm dev:frontend`             | Start the Quasar dev server                 |
| `pnpm dev:worker`               | Start the Worker dev server                 |
| `pnpm build:frontend`           | Build the frontend for production           |
| `pnpm build:worker`             | Build the Worker for production             |
| `pnpm test`                     | Run all Vitest tests (worker + frontend)    |
| `pnpm test:e2e`                 | Run Playwright e2e tests (frontend)         |
| `pnpm lint`                     | Run ESLint across all packages              |
| `pnpm lint:fix`                 | Run ESLint with `--fix` across all packages |
| `pnpm format`                   | Run Prettier format across all packages     |
| `pnpm format:check`             | Run Prettier check across all packages      |
| `supabase start`                | Start the local Supabase stack              |
| `supabase db diff`              | Generate a migration from schema changes    |
| `supabase gen types typescript` | Generate TypeScript types from the database |
| `wrangler dev`                  | Start the Worker locally via Wrangler       |
| `wrangler deploy`               | Deploy the Worker to production             |

## Architecture notes

- **No direct database access from the browser.** The frontend uses the Supabase publishable key only for authentication. All data operations go through the Hono Worker, which uses the Supabase secret key.
- **RLS is enabled** on all tables as defense-in-depth, even though the Worker bypasses it with the secret key.
- **File uploads** (avatars, logos) go directly from the frontend to Supabase Storage, not through the Worker.
- **Real-time updates** use Supabase Realtime subscriptions on the `notifications` table.
- **Geocoding** is proxied through the Hono Worker to respect Nominatim usage policy and cache results in Cloudflare KV.
- **Domain-driven design (DDD)** is used inside the Worker. Each domain (`auth`, `events`, `tournaments`, `stores`, `notifications`, `moderation`, `geocoding`, `tcgs`) owns its routes, validators, services, and database queries. Cross-domain logic lives in `src/services/`. See `AGENTS.md` for the full structure.

## SEO strategy

This project uses a **hybrid approach** (not full SSR):

1. **Quasar Meta plugin** sets dynamic `<title>`, `<meta>`, OpenGraph, Twitter Card, and JSON-LD tags client-side.
2. **Static routes** (`/`, `/login`, `/signup`, `/stores`, legal pages) are prerendered at build time.
3. **Dynamic rendering for crawlers**: a Cloudflare Worker detects crawler user-agents and returns a minimal HTML shell with the correct meta tags and JSON-LD for detail pages.

See `docs/pages.md` and `AGENTS.md` for more details.

## Testing

### Unit & Integration (Vitest)

Worker API routes and middleware are tested with **Vitest** (mocked Supabase client).
Frontend stores and components are tested with **Vitest** + **@vue/test-utils** (mocked fetch, jsdom environment).

```bash
pnpm test              # Run all tests (worker + frontend unit)
pnpm test:watch        # Watch mode
```

### E2E (Playwright)

Frontend pages are tested with **Playwright**. Tests run against the full local stack (frontend + Worker), auto-started by Playwright.

Prerequisites:

- Local Supabase running: `supabase start`
- `.env` files configured (see `.env.example` in each package)

```bash
pnpm test:e2e          # Playwright starts Quasar + Wrangler, runs tests
pnpm dev:e2e           # Start everything manually + run tests in foreground
```

For Supabase-dependent tests, ensure the local Supabase stack is running first:

## Deployment

### Database types

Generate TypeScript types from the local Supabase database:

```bash
pnpm db:types
# Generates packages/shared/src/database.types.ts
```

This must be run after every schema migration and requires `supabase start` to be running.

### Frontend (Cloudflare Pages)

1. Connect your Git repository to Cloudflare Pages.
2. Build command: `pnpm build:frontend`
3. Output directory: `packages/frontend/dist/spa`
4. Environment variables (set in Pages dashboard):
   - `VITE_SUPABASE_URL` — Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key
   - `VITE_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key
   - `VITE_SENTRY_DSN` — Sentry DSN (optional)
   - `VITE_API_URL` — Worker URL (e.g., `https://api.yourdomain.com`)
5. Deploy. Cloudflare Pages auto-builds and deploys on push.

### Worker (Cloudflare Workers)

1. Configure KV namespaces in the Cloudflare dashboard:
   - Create `GEOCODING_KV` and `RATE_LIMIT_KV` namespaces
   - Copy their IDs into `packages/worker/wrangler.jsonc`
2. Set secrets with `wrangler secret put`:

```bash
cd packages/worker
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SECRET_KEY
wrangler secret put SUPABASE_PUBLISHABLE_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put SENTRY_DSN
```

3. Deploy:

```bash
wrangler deploy
```

### Supabase (Production)

```bash
supabase db push          # Apply migrations to production
pnpm db:types             # Regenerate types after migration
```

## Project documentation

- `docs/requirements.md` — functional and non-functional requirements
- `docs/use-cases.md` — user interaction flows
- `docs/data-model.md` — database entities and relationships
- `docs/pages.md` — routes, layouts, and component structure
- `AGENTS.md` — conventions and guidance for AI-assisted development
- `CHANGELOG.md` — notable changes and decisions

## Contributing

This project follows spec-driven development:

1. Write or update a spec in `/spec/spec-NNN-purpose.md`.
2. Generate a `plan.md` in the same spec directory.
3. Implement test-first following the red-green-refactor cycle.
4. Keep documentation in sync with code changes.

See `AGENTS.md` for the full workflow and coding conventions.

## License

[MIT](LICENSE)
