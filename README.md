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

| Layer | Technology |
|-------|------------|
| Frontend | [Quasar](https://quasar.dev/) (Vue 3 + Vite + TypeScript) |
| State | [Pinia](https://pinia.vuejs.org/api/) |
| Utilities | [VueUse](https://vueuse.org/guide/) (geolocation, storage, debounce) |
| API client | [Hono RPC](https://hono.dev/docs/guides/rpc) — fully typed client from Worker routes |
| API | [Hono](https://hono.dev/) on Cloudflare Workers |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + PostGIS + Auth + Realtime) |
| Validation | [Zod](https://zod.dev/) |
| Maps | [Leaflet](https://leafletjs.com/) + OpenStreetMap |
| Geocoding | [Nominatim](https://nominatim.org/) (proxied through Hono) |
| Bracket rendering | [D3.js](https://d3js.org/api) |
| Tests | [Vitest](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/) + [MSW](https://mswjs.io/) |
| Date/time | [Luxon](https://moment.github.io/luxon/) |
| Observability | [Sentry](https://sentry.io/) |
| CI/CD | Cloudflare Pages (frontend) + Workers (API) |
| Bot protection | [Turnstile](https://www.cloudflare.com/products/turnstile/) |
| Email | [Resend](https://resend.com/) (custom SMTP)

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

- [Node.js](https://nodejs.org/) 20+ (use the version in `.nvmrc` if present)
- [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) project
- A [Cloudflare](https://cloudflare.com/) account for Pages and Workers
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) for Worker development
- [Supabase CLI](https://supabase.com/docs/guides/cli) for local database development

## Development setup

1. Clone the repository:

```bash
git clone <repo-url>
cd tcg-matchmaker
```

2. Install dependencies:

```bash
pnpm install
```

3. Copy environment files and fill in your values:

```bash
cp packages/frontend/.env.example packages/frontend/.env
cp packages/worker/.env.example packages/worker/.env
```

4. Start the local Supabase stack:

```bash
supabase start
```

5. In a separate terminal, generate TypeScript types from the local database:

```bash
supabase gen types typescript --local > packages/shared/src/database.types.ts
```

6. Start the Worker:

```bash
pnpm dev:worker
```

7. In another terminal, start the frontend:

```bash
pnpm dev:frontend
```

The frontend is usually available at `http://localhost:9000` and the Worker at `http://localhost:8787`.

## Environment variables

### Frontend (`packages/frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (used only for Auth) |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `VITE_SENTRY_DSN` | Sentry DSN for frontend error tracking |
| `VITE_API_URL` | Hono Worker URL (e.g., `http://localhost:8787` locally) |

### Worker (`packages/worker/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Supabase secret key (used for all DB operations) |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (used to verify JWTs) |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `SENTRY_DSN` | Sentry DSN for backend error tracking |
| `NOMINATIM_USER_AGENT` | User agent for Nominatim geocoding requests |

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

| Command | Description |
|---------|-------------|
| `pnpm dev:frontend` | Start the Quasar dev server |
| `pnpm dev:worker` | Start the Worker dev server |
| `pnpm build:frontend` | Build the frontend for production |
| `pnpm build:worker` | Build the Worker for production |
| `pnpm test` | Run all tests with Vitest |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |
| `supabase start` | Start the local Supabase stack |
| `supabase db diff` | Generate a migration from schema changes |
| `supabase gen types typescript` | Generate TypeScript types from the database |
| `wrangler dev` | Start the Worker locally via Wrangler |
| `wrangler deploy` | Deploy the Worker to production |

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

Tests are written with Vitest:

- Unit tests for composables, utilities, and shared schemas.
- Component tests with `@vue/test-utils`.
- API tests with `@cloudflare/vitest-pool-workers` for the Hono routes.

Run the full test suite:

```bash
pnpm test
```

Run tests in watch mode during development:

```bash
pnpm test:watch
```

## Deployment

### Frontend (Cloudflare Pages)

1. Connect your Git repository to Cloudflare Pages.
2. Set the build command to `pnpm build:frontend`.
3. Set the output directory to the Quasar build output (e.g., `packages/frontend/dist/spa` or `packages/frontend/dist/pwa`, depending on your mode).
4. Add the frontend environment variables in the Pages dashboard.
5. Deploy. Pages will automatically build and deploy on every push.

### Worker (Cloudflare Workers)

1. Configure `wrangler.jsonc` in `packages/worker/`.
2. Set all required secrets via `wrangler secret put`.
3. Deploy:

```bash
cd packages/worker
wrangler deploy
```

### Supabase

Apply migrations to production:

```bash
supabase db push
```

Generate TypeScript types after schema changes:

```bash
supabase gen types typescript --local > packages/shared/src/database.types.ts
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
