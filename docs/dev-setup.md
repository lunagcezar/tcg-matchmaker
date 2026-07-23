# Local Development Setup

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with credentials from `supabase status` after step 3

# 3. Start Supabase
supabase start

# 4. Generate TypeScript types from local DB
supabase gen types typescript --local > packages/shared/src/database.types.ts

# 5. Seed database + create auth users
bash scripts/setup-dev.sh

# 6. In separate terminals:
#    Worker at http://localhost:8787
cd packages/worker && pnpm dev

#    Frontend at http://localhost:9000
cd packages/frontend && quasar dev
```

## Seed data

The setup script (`scripts/setup-dev.sh`) does two things:

1. **`supabase db reset --local`** — applies all migrations then runs `supabase/seed.sql`, which inserts sample records:
   - `users` — 5 profile records (admin + 4 players)
   - `tcgs` — 4 TCGs (Magic, Pokémon, Yu-Gi-Oh!, One Piece) with formats
   - `game_stores` — 3 stores in Fortaleza
   - `events` — 5 events (matches + trading sessions, some with participants)
   - `notifications`, `reports`, `audit_log` — sample records

2. **Auth user creation** — waits for the Auth container to start, then calls the Auth Admin API to create login-capable users with the **same UUIDs** used in the seed, so all foreign keys (event creators, participants, store owners) remain valid.

### Seed accounts

All use password `password123`:

| Email                | Username | Role   |
| -------------------- | -------- | ------ |
| `admin@tcgmatch.app` | `admin`  | Admin  |
| `alice@example.com`  | `alice`  | Player |
| `bob@example.com`    | `bob`    | Player |
| `carol@example.com`  | `carol`  | Player |
| `dave@example.com`   | `dave`   | Player |

### Why a separate script?

The `auth` schema (with `users` and `identities` tables) is created by the Supabase Auth service when its container starts. This happens _after_ `supabase db reset --local` finishes. You cannot create auth users from `seed.sql` because the auth tables don't exist at seed time. The setup script bridges this gap by waiting for the Auth API and creating users via the admin endpoint.

## Running without seed

To apply migrations without seed data:

```bash
supabase db push --local
```

To permanently disable the seed, set `enabled = false` in the `[db.seed]` section of `supabase/config.toml`.

## Resetting

```bash
bash scripts/setup-dev.sh
```

This is idempotent — re-running it drops everything, re-applies migrations, re-seeds, and re-creates auth users.

## Manual auth user creation

If you need to add a user from the command line:

```bash
SERVICE_ROLE_KEY=$(supabase status --output json | grep -o '"SERVICE_ROLE_KEY":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d '{"email":"user@example.com","password":"mypassword","email_confirm":true}'
```

The response includes the user's UUID. Insert a matching profile record:

```bash
PSQL_CMD="psql postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Replace UUID with the one from the API response
$PSQL_CMD -c "INSERT INTO public.users (id, email, username, role) VALUES ('<uuid>', 'user@example.com', 'username', 'player');"
```

## Troubleshooting

### Worker returns 500 on event detail

Ensure the shared package is built (it exports `dist/index.js`):

```bash
cd packages/shared && pnpm build
```

Then restart the Worker.

### Auth API returns "Database error checking email"

The user already exists in `auth.users`. Delete and recreate:

```bash
PSQL_CMD="psql postgresql://postgres:postgres@127.0.0.1:54322/postgres"
$PSQL_CMD -c "DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email='user@example.com');"
$PSQL_CMD -c "DELETE FROM auth.users WHERE email='user@example.com';"
```

Then create via the admin API (see above).

### Port already in use

If `localhost:8787` is occupied, kill the existing worker process:

```bash
lsof -ti :8787 | xargs kill
```

### Supabase containers not starting

Check Docker is running, then:

```bash
supabase stop
supabase start
```
