---
title: Project Infrastructure — Monorepo, Shared Package, Database, Worker & Frontend Scaffolds
version: 1.0
date_created: 2026-07-14
tags: infrastructure, monorepo, setup, scaffold
---

# Introduction

This specification defines the foundational project infrastructure for TCG Matchmaker. It establishes the monorepo workspace, shared TypeScript library, database migration, Hono API worker, and Quasar frontend scaffold so that all subsequent specs can build features on a working foundation.

## 1. Purpose & Scope

**Purpose:** Create the physical directory structure, configuration files, and boilerplate code that enables parallel development across all three packages (`@tcg/shared`, `@tcg/worker`, `@tcg/frontend`), plus the Supabase database migration pipeline.

**Scope:**

- Root monorepo configuration (pnpm workspace, root scripts, shared TypeScript config)
- `packages/shared/` — Zod schemas, types, and constants
- `packages/worker/` — Hono app skeleton with Wrangler config
- `packages/frontend/` — Quasar SPA skeleton
- `supabase/` — CLI config and initial migration (PostGIS + `public.users` + `consents`)
- Shared dev tooling (ESLint, Prettier, tsconfig bases)

**Out of scope:**

- Business logic, API routes, frontend pages, composables, components (covered by subsequent specs)
- i18n translation files (scaffold only — content filled later)
- Feature-specific schemas beyond the minimal set needed for bootstrapping

## 2. Definitions

| Term     | Definition                                                                   |
| -------- | ---------------------------------------------------------------------------- |
| Monorepo | A single repository containing multiple packages, managed by pnpm workspaces |
| Hono     | Lightweight, fast web framework for Cloudflare Workers                       |
| Quasar   | Vue 3-based UI framework with built-in Vite support                          |
| Wrangler | Cloudflare CLI for managing Workers                                          |
| PostGIS  | PostgreSQL extension for geospatial queries                                  |
| RLS      | Row-Level Security — Postgres feature for per-row access control             |
| Zod      | TypeScript-first schema validation library                                   |

## 3. Requirements, Constraints & Guidelines

### Infrastructure Requirements

- **INF-001**: The root `package.json` must define workspace-level scripts (`dev`, `test`, `lint`, `format`) that delegate to individual packages via `pnpm -F <package>`.
- **INF-002**: Shared TypeScript configuration must be defined as a base `tsconfig.base.json` at root, extended by each package.
- **INF-003**: ESLint must be configured at root with TypeScript + Quasar preset, shared by all packages.
- **INF-004**: Prettier must be configured at root with `singleQuote`, `trailingComma: "all"`, `printWidth: 100`.
- **INF-005**: A `.gitignore` must exist at root excluding `node_modules`, `dist`, `.env`, `.wrangler`, `.supabase`.

### Shared Package (`@tcg/shared`)

- **SHARED-001**: Package name MUST be `@tcg/shared` with entry point `src/index.ts`.
- **SHARED-002**: Must export Zod schemas (`src/schemas/`), derived TypeScript types (`src/types/`), and constants (`src/constants.ts`).
- **SHARED-003**: Initial schemas: `common.ts` (pagination, cursor, API response), `user.ts` (signup, login, profile, user).
- **SHARED-004**: Must compile with `tsc` to a `dist/` directory. No bundler required.
- **SHARED-005**: Must NOT depend on any runtime framework (Vue, Hono, etc.) — it is a pure TypeScript library.

### Worker Package (`@tcg/worker`)

- **WRKR-001**: Package name MUST be `@tcg/worker` with entry point `src/index.ts`.
- **WRKR-002**: MUST use `wrangler.jsonc` (not `.toml`) for Cloudflare configuration with `main` pointing to `src/index.ts`.
- **WRKR-003**: MUST define `compatibility_date` and `compatibility_flags` in `wrangler.jsonc`.
- **WRKR-004**: MUST export the Hono app type for `hono/client` consumption by the frontend.
- **WRKR-005**: Initial middleware stack: CORS (accepts Pages domain + localhost), error handler, JSON body parser.
- **WRKR-006**: Must have a `tsconfig.json` extending the root base config with `types: ["@cloudflare/workers-types"]`.
- **WRKR-007**: Must have an `.env.example` documenting all required environment variables.

### Frontend Package (`@tcg/frontend`)

- **FE-001**: MUST be a Quasar SPA project (Vue 3 + Vite + TypeScript) with `package.json` name `@tcg/frontend`.
- **FE-002**: Must have `src/router/routes.ts` defining a minimal route table (home, login, signup, onboarding, profile).
- **FE-003**: Must have `src/stores/` with empty `useAuthStore` and `useAppStore` scaffolds.
- **FE-004**: Must have `src/composables/` directory (empty — filled by subsequent specs).
- **FE-005**: Must have `src/i18n/` with `en-US.ts` and `pt-BR.ts` skeleton files.
- **FE-006**: Must have an `.env.example` documenting all frontend environment variables.

### Database

- **DB-001**: MUST have `supabase/config.toml` with project-level configuration, `enabledExtensions: ["postgis"]`.
- **DB-002**: Initial migration `YYYYMMDDHHMMSS_project_infrastructure.sql` must include:
  - `CREATE EXTENSION IF NOT EXISTS postgis`
  - `public.users` table with columns matching `docs/data-model.md`
  - `public.consents` table with LGPD consent recording
  - RLS enabled on both tables but without explicit policies (Hono bypasses RLS via secret key; policies added later as defense-in-depth)
- **DB-003**: Migrations MUST be idempotent (use `IF NOT EXISTS` / `CREATE OR REPLACE`).
- **DB-004**: A `seed.sql` file with no-op (empty seed, filled by subsequent specs).

### Tooling

- **TOOL-001**: `pnpm` is the sole package manager — `packageManager` field MUST be set in root `package.json`.
- **TOOL-002**: All packages MUST use shared ESLint + Prettier configs from root.
- **TOOL-003**: `tsc` must compile cleanly with `--noEmit` for all packages on `pnpm lint`.

## 4. Interfaces & Data Contracts

### File/Directory Structure (after implementation)

```
tcg-matchmaker/
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── package.json                     # Root scripts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── YYYYMMDDHHMMSS_project_infrastructure.sql
│   └── seed.sql
└── packages/
    ├── shared/
    │   ├── package.json             # @tcg/shared
    │   ├── tsconfig.json
    │   └── src/
    │       ├── schemas/
    │       │   ├── common.ts
    │       │   └── user.ts
    │       ├── types/
    │       │   └── index.ts
    │       ├── constants.ts
    │       └── index.ts
    ├── worker/
    │   ├── package.json             # @tcg/worker
    │   ├── tsconfig.json
    │   ├── wrangler.jsonc
    │   ├── .env.example
    │   └── src/
    │       └── index.ts             # Hono app
    └── frontend/
        ├── package.json             # @tcg/frontend
        ├── .env.example
        ├── tsconfig.json
        ├── quasar.config.js         # (or .ts)
        └── src/
            ├── App.vue
            ├── main.ts
            ├── router/
            │   └── routes.ts
            ├── stores/
            │   ├── useAuthStore.ts
            │   └── useAppStore.ts
            ├── composables/         # (empty)
            ├── i18n/
            │   ├── en-US.ts
            │   └── pt-BR.ts
            └── layouts/
                └── MainLayout.vue
```

### Initial Zod Schemas

```typescript
// shared/src/schemas/common.ts
import { z } from 'zod';

export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const CursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.nullable(),
    error: z.string().nullable(),
    meta: z.record(z.unknown()).nullable(),
  });
```

### Initial User Schemas

```typescript
// shared/src/schemas/user.ts
import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  display_name: z.string().min(1).max(50),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  display_name: z.string(),
  role: z.enum(['player', 'organizer', 'admin']),
  avatar_path: z.string().nullable(),
  created_at: z.string().datetime(),
});

export const ProfileUpdateSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
});
```

## 5. Acceptance Criteria

- **AC-001**: `pnpm install` at root installs dependencies for all three packages without errors.
- **AC-002**: `pnpm -F @tcg/shared exec tsc --noEmit` compiles without errors.
- **AC-003**: `pnpm -F @tcg/worker exec tsc --noEmit` compiles without errors.
- **AC-004**: `pnpm -F @tcg/frontend exec quasar build` builds successfully.
- **AC-005**: `wrangler dev` in `packages/worker/` starts the Hono server on port 8787.
- **AC-006**: `supabase db diff` detects no unapplied changes after migration runs.
- **AC-007**: `pnpm lint` passes with no errors on all packages.
- **AC-008**: The database migration creates `public.users` table with all required columns.
- **AC-009**: The database migration creates `public.consents` table with all required columns.
- **AC-010**: `CREATE EXTENSION postgis` is executed as part of the migration.
- **AC-011**: The shared package exports are importable from both worker and frontend packages.

## 6. Test Automation Strategy

- **Test Levels**: Only infrastructure smoke tests — verification that builds and lint pass.
- **Frameworks**: Vitest configured at root for future use, but no actual tests in this spec.
- **CI/CD Integration**: All acceptance criteria must pass before merging.

## 7. Rationale & Context

- **Monorepo with pnpm workspaces**: Enables shared types between frontend and worker without duplication or workspace-level complications. Each package has its own `package.json` and dependencies.
- **Hono over Express/Fastify**: Hono is purpose-built for Cloudflare Workers, has zero Node.js dependencies, and supports `hono/client` for typed RPC.
- **Quasar over bare Vue**: Provides built-in SSR alternatives, PWA support, i18n, Meta plugin, theming, and responsive layout system — all needed by this project.
- **Separate shared package**: Avoids circular dependencies and allows both frontend and worker to validate against the same Zod schemas.
- **PostGIS in initial migration**: Geospatial queries are a core feature — enabling PostGIS upfront prevents schema migration headaches later.
- **RLS without policies initially**: Policies will be added as defense-in-depth in a subsequent spec once the auth middleware is in place.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Supabase (PostgreSQL + Auth) — required for database and authentication. Local instance via `supabase start` for development.
- **EXT-002**: Cloudflare Workers — deployment target for the Hono API. Wrangler used for local development.

### Third-Party Services

- **SVC-001**: OpenStreetMap / Nominatim — geocoding (proxied through Hono). Public API, no key required but usage policy limits apply.
- **SVC-002**: Resend — transactional email delivery via custom SMTP. API key required.

### Infrastructure Dependencies

- **INF-001**: Node.js 20+ with pnpm 9+ — required for local development.
- **INF-002**: Wrangler CLI — required for Worker development and deployment.
- **INF-003**: Supabase CLI — required for local database and migration management.

### Technology Platform Dependencies

- **PLT-001**: Cloudflare Workers runtime (ES modules, Service Workers format) — Hono app must export `default` fetch handler.
- **PLT-002**: Workers `compatibility_date` must be set to a date no older than 2024-01-01.

### Compliance Dependencies

- **COM-001**: LGPD (Brazilian General Data Protection Law) — consent recording in `consents` table required at signup.

## 9. Examples & Edge Cases

### Migration Idempotency

```sql
-- Good: idempotent with IF NOT EXISTS
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  ...
);
```

### Package dependency structure

```json
// packages/worker/package.json — dependencies
{
  "dependencies": {
    "@tcg/shared": "workspace:*",
    "hono": "^4.x"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.x",
    "wrangler": "^3.x"
  }
}
```

```json
// packages/frontend/package.json — dependencies
{
  "dependencies": {
    "@tcg/shared": "workspace:*",
    "@tcg/worker": "workspace:*"
  },
  "devDependencies": {
    "@quasar/app-vite": "^2.x",
    "quasar": "^2.x"
  }
}
```

## 10. Validation Criteria

- `git status` shows no uncommitted changes after scaffolding (config files in place).
- `pnpm install --frozen-lockfile` succeeds (lockfile integrity).
- `pnpm list --depth 0 -r` shows all three packages recognized by the workspace.
- `wrangler dev` responds to `GET /` with a valid HTTP response (even if 404).

## 11. Related Specifications / Further Reading

- `docs/data-model.md` — Full entity definitions
- `docs/requirements.md` — Functional and non-functional requirements
- `docs/pages.md` — Route map and component structure
- `docs/use-cases.md` — User interaction flows
- `AGENTS.md` — Development methodology and conventions
