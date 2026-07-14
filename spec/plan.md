# Plan — spec-001: Project Infrastructure

## Summary

Create the monorepo workspace with three packages (`@tcg/shared`, `@tcg/worker`, `@tcg/frontend`), root dev tooling, and the initial Supabase migration. Implementation order respects the dependency graph: root → shared → worker → frontend, with supabase parallel.

## Implementation Order

```
         ┌─────────────────┐
         │  Root configs   │  (1) package.json, tsconfig.base.json,
         │  (no deps)      │      .prettierrc, .eslintrc.cjs, .gitignore
         └────────┬────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
 ┌─────────┐ ┌──────────┐ ┌────────────┐
 │ shared  │ │ supabase │ │  worker    │  (2) Shared: pure TS lib
 │ (pure)  │ │ (SQL)    │ │ (Hono)     │  (3) Supabase: migration + config
 └────┬────┘ └──────────┘ └─────┬──────┘     Worker: depends on shared
      │                         │
      └──────────┬──────────────┘
                 ▼
         ┌────────────────┐
         │   frontend     │  (4) Quasar SPA, depends on shared + worker types
         └────────────────┘
```

## Parallelizable Blocks

| Block | Items | Dependencies |
|-------|-------|-------------|
| A | Root configs | None |
| B | `@tcg/shared` package | None (pure TS) |
| C | `supabase/` config + migration | None |
| D | `@tcg/worker` package | B (shared) |
| E | `@tcg/frontend` package | B + D (shared + worker types) |

Blocks A, B, C can run in parallel. D follows B. E follows B + D.

## Mapping: Requirements → Implementation

| Spec Req | Implementation | Files |
|----------|---------------|-------|
| INF-001 to INF-005 | Root `package.json`, `tsconfig.base.json`, `.prettierrc`, `.eslintrc.cjs`, `.gitignore` | Root directory |
| SHARED-001 to SHARED-005 | `packages/shared/` with package.json, tsconfig, src/ | `packages/shared/` |
| WRKR-001 to WRKR-007 | `packages/worker/` with package.json, wrangler.jsonc, Hono app | `packages/worker/` |
| FE-001 to FE-006 | `packages/frontend/` — Quasar SPA (scaffold via `pnpm create quasar`, then adjust) | `packages/frontend/` |
| DB-001 to DB-004 | `supabase/config.toml`, migration SQL, seed.sql | `supabase/` |
| TOOL-001 to TOOL-003 | ESLint, Prettier, tsconfig inheritance | Root + package tsconfigs |

## Technical Decisions

1. **Root package.json**: Use `pnpm -F` to delegate to package scripts. Scripts: `dev`, `build`, `test`, `lint`, `format`.
2. **TypeScript**: Single `tsconfig.base.json` at root with `strict: true`, `moduleResolution: "bundler"`. Each package extends it with package-specific overrides.
3. **Shared package**: Compile with `tsc` to `dist/`. `main` and `types` in package.json point to `dist/index.js` and `dist/index.d.ts`.
4. **Worker package**: Hono v4, ES module format (`"type": "module"` in package.json). Export `app` type for `hono/client`.
5. **Frontend package**: Scaffold with `pnpm create quasar@latest packages/frontend --template app --preset typescript,pinia,eslint,i18n --defaults --no-git -i pnpm`, then:
   - Update `package.json` to add `@tcg/shared` and `@tcg/worker` workspace dependencies
   - Add `src/composables/` directory
   - Add `src/stores/useAuthStore.ts` and `useAppStore.ts` scaffolds
   - Add `src/i18n/en-US.ts` and `pt-BR.ts` with empty exports
   - Add `src/router/routes.ts` with initial route definitions
   - Add `.env.example`
6. **Supabase**: Use Supabase CLI config format. Migration filename uses timestamp format `YYYYMMDDHHMMSS`.
7. **ESLint**: Use flat config or traditional `.eslintrc.cjs` with TypeScript + Quasar presets. Based on Quasar defaults, use `.eslintrc.cjs`.
8. **pnpm version**: Pin to `11.13.0` in root package.json `packageManager` field.

## Concrete File List

### Root (6 files)
- `package.json` — workspace scripts, packageManager, devDependencies (typescript, prettier, eslint)
- `tsconfig.base.json` — strict mode, bundler module resolution
- `.prettierrc` — singleQuote, trailingComma: "all", printWidth: 100
- `.eslintrc.cjs` — extends TypeScript + Prettier
- `.gitignore` — node_modules, dist, .env, .wrangler, .supabase
- `pnpm-workspace.yaml` — already exists: `packages: ['packages/*']`

### packages/shared/ (7 files)
- `package.json` — name @tcg/shared, workspace:*, build script "tsc"
- `tsconfig.json` — extends ../../tsconfig.base.json, outDir dist, rootDir src
- `src/schemas/common.ts` — PaginationSchema, CursorSchema, ApiResponseSchema
- `src/schemas/user.ts` — SignupSchema, LoginSchema, UserSchema, ProfileUpdateSchema
- `src/types/index.ts` — re-exports from schemas
- `src/constants.ts` — empty shell
- `src/index.ts` — re-exports everything

### packages/worker/ (6 files)
- `package.json` — name @tcg/worker, dependencies: hono, @tcg/shared
- `tsconfig.json` — extends base, types: @cloudflare/workers-types
- `wrangler.jsonc` — main, compatibility_date, compatibility_flags, no routes yet
- `.env.example` — SUPABASE_URL, SUPABASE_SECRET_KEY, etc.
- `src/index.ts` — Hono app with CORS, JSON body parser, error handler, 404 handler, export app type

### packages/frontend/ (scaffolded by quasar create + modifications)
- Scaffold: `pnpm create quasar@latest packages/frontend --template app --preset typescript,pinia,eslint,i18n,sass --defaults --no-git -i pnpm`
- Then modify:
  - `package.json` — add workspace deps on @tcg/shared + @tcg/worker
  - `src/router/routes.ts` — define initial routes
  - `src/stores/useAuthStore.ts` — stub
  - `src/stores/useAppStore.ts` — stub
  - `src/i18n/en-US.ts` — basic translations
  - `src/i18n/pt-BR.ts` — basic translations
  - `src/composables/` — create empty directory
  - `.env.example` — VITE_* variables

### supabase/ (3 files)
- `config.toml` — project config with postgis enabled
- `migrations/YYYYMMDDHHMMSS_project_infrastructure.sql` — PostGIS + users + consents
- `seed.sql` — empty

## Acceptance Criteria Check

| AC | How to verify |
|----|--------------|
| AC-001 | `pnpm install` exits 0 |
| AC-002 | `pnpm -F @tcg/shared exec tsc --noEmit` exits 0 |
| AC-003 | `pnpm -F @tcg/worker exec tsc --noEmit` exits 0 |
| AC-004 | `pnpm -F @tcg/frontend exec quasar build` exits 0 |
| AC-005 | `wrangler dev` (manual check — starts on 8787) |
| AC-006 | Requires supabase stack — noted as blocking |
| AC-007 | `pnpm lint` exits 0 |
| AC-008 | Manual verify migration SQL creates users table |
| AC-009 | Manual verify migration SQL creates consents table |
| AC-010 | Manual verify migration SQL has `CREATE EXTENSION postgis` |
| AC-011 | Verify imports resolve in worker and frontend tsconfig |
