---
title: Client Refactoring — API Layer, State Management, Type Fixes
version: 1.0
date_created: 2026-07-15
tags: frontend, refactoring, api, stores
---

# Client Refactoring

## 1. Purpose & Scope

Clean up the frontend client architecture: replace the Hono RPC client (which had unresolvable cross-package type issues) with a simple typed fetch wrapper, delete dead composables, consolidate shared state into Pinia stores, and fix all TypeScript type errors.

## 2. Changes

### API Layer (`src/composables/useApi.ts`)

Replaced `hc<AppType>()` from `hono/client` with four simple fetch wrapper functions:

- `apiGet(path)` → GET request
- `apiPost(path, body?)` → POST request
- `apiPatch(path, body)` → PATCH request
- `apiDelete(path)` → DELETE request

All return `Promise<{ data: unknown; error: string | null; meta: null }>`. TypeScript errors were fixed by adding explicit `as` casts at assignment sites.

**Why not Hono RPC:** The `hc<AppType>()` client requires deep type inference from the Worker route handlers, which include Cloudflare-specific bindings (`KVNamespace`, etc.) that `vue-tsc` can't resolve across monorepo packages. All 55+ type errors were `Object is of type 'unknown'`.

### Dead Composable Deletion

Removed 5 composables that had zero imports across the codebase:

| Composable          | Superseded By              | Reason    |
| ------------------- | -------------------------- | --------- |
| `useEvent.ts`       | `useEventStore` (Pinia)    | Duplicate |
| `useStore.ts`       | `useStoreStore` (Pinia)    | Duplicate |
| `useTournament.ts`  | Direct `apiGet/Post` calls | Unused    |
| `useTcg.ts`         | Direct `apiGet/Post` calls | Unused    |
| `useGeolocation.ts` | Never integrated           | Unused    |

### State Migration

Moved `useNotifications` composable (shared state used by 3 components) to `useNotificationStore` (Pinia) for global singleton access.

### Store Gap Fill

Added missing methods to `useStoreStore`:

- `update(id, input)` — PATCH `/api/stores/:id`
- `getMembers(storeId)` — GET `/api/stores/:id/members`

Updated `stores/DetailPage.vue` and `stores/SettingsPage.vue` to use store methods instead of direct API calls.

### TypeScript Fixes

- Added `types` field to `@tcg/worker` package.json for proper module resolution
- Added `@cloudflare/workers-types` to frontend devDependencies
- Excluded `worker` and `shared` directories from frontend tsconfig to prevent cascading type failures
- Fixed all 55+ TypeScript errors across stores, composables, and pages
- Fixed `exactOptionalPropertyTypes` incompatibilities in bracket match data mapping
- Updated test assertions for the new fetch function signatures

## 3. Test Changes

Updated `useAdminStore.test.ts` — fetch assertions adjusted because `apiGet` calls `fetch(url)` with 1 arg while `apiPost/apiDelete` call `fetch(url, options)` with 2.

Moved `useNotifications.test.ts` from composables to stores (new `useNotificationStore`).

## 4. Acceptance Criteria

- **AC-001**: `apiGet('/api/events')` returns `{ data, error, meta }` matching all caller expectations
- **AC-002**: `pnpm typecheck` passes with 0 frontend TypeScript errors
- **AC-003**: `pnpm test` passes with all 99 tests (64 worker + 35 frontend)
- **AC-004**: No dead composables remain (useEvent, useStore, useTournament, useTcg, useGeolocation deleted)
- **AC-005**: Notifications state is a Pinia store, used by all 3 consumers
- **AC-006**: `useStoreStore` exposes `update()` and `getMembers()` methods
