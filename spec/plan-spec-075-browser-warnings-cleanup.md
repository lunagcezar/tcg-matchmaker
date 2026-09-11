# plan-spec-075-browser-warnings-cleanup

## 1. Goal

Execute `spec-075-browser-warnings-cleanup`: eliminate the Vue Router `next()`-callback deprecation warnings and the "Multiple GoTrueClient instances" warning from the browser console, without any behavioral change.

## 2. Parallelizable Task Groups

### Group A — Router guard refactor (frontend, TDD)

- A1. Write `packages/frontend/src/router/__tests__/guards.test.ts` covering the full guard matrix with mocked `useAuthStore` and `apiGet`.
- A2. Create `packages/frontend/src/router/guards.ts` exporting `routerGuard: NavigationGuard` that returns values instead of calling `next` (satisfies A1).
- A3. Rewire `packages/frontend/src/router/index.ts` to `Router.beforeEach(routerGuard)` and delete the inline guard.

### Group B — Deduplicate Supabase client (frontend, TDD)

- B1. Write a source-invariant regression test asserting `createClient(` appears exactly once in frontend `src`.
- B2. Edit `packages/frontend/src/stores/useNotificationStore.ts` to import `supabase` from `@/lib/supabase` and drop its own `createClient` (satisfies B1).

### Group C — Verification & commit (depends on A + B)

- C1. Run `pnpm test` (whole suite).
- C2. Run `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check`.
- C3. Update `CHANGELOG.md`.
- C4. Manual console check under `pnpm dev` (three warnings gone).
- C5. Commit `fix(frontend): implement spec-075`.

## 3. Task Order / Dependencies

```
A1 ─► A2 ─► A3 ─┐
                ├─► C (verify + commit)
B1 ─► B2 ───────┘
```

A and B are independent and can run in any order (or in parallel). C requires both to be green.

## 4. Technical Decisions

- **Extract guard to its own module** (`guards.ts`): makes the guard unit-testable without mounting the router and satisfies REQ-003. `src/router/index.ts` keeps only router creation + wiring.
- **Static imports in `guards.ts`**: replace the guard's dynamic `await import(...)` of `useAuthStore`/`apiGet` with top-level imports. The store module is already part of the app bundle; `useAuthStore()` is still invoked lazily inside the guard body, so Pinia setup order is unaffected.
- **Return mapping**: every `next(x)` becomes `return x`; `next()` (allow) becomes `return` (i.e. `undefined`), preserving exact behavior.
- **Shared client reuse**: `useNotificationStore` imports the canonical `supabase` from `@/lib/supabase`, removing the second GoTrueClient. The `!supabase` null guard stays.
- **Regression-proof**: the source-invariant test (B1) guards against future `createClient` duplication.

## 5. Testing Strategy

- Unit test `guards.test.ts` mocks `@/stores/useAuthStore` and `@/composables/useApi` via `vi.mock`; asserts returned guard values (redirects, allow) per the acceptance criteria in spec-075 AC-002…AC-005.
- Source-invariant test reads frontend `src` files and counts `createClient(` occurrences (must be exactly 1, in `src/lib/supabase.ts`).
- Existing `navItems.test.ts` and all other tests must stay green.

## 6. Risks & Mitigations

| Risk                               | Mitigation                                                                |
| ---------------------------------- | ------------------------------------------------------------------------- |
| Guard refactor changes auth flow   | Unit tests lock the full redirect matrix; keep exact return mapping.      |
| Static imports change load order   | Store functions still called lazily in guard body; Pinia init unaffected. |
| `createClient` duplicated later    | Source-invariant test fails on >1 occurrence.                             |
| Missing env vars (`supabase` null) | `subscribeRealtime` null guard retained; test AC-009.                     |

## 7. Definition of Done

- All tasks in groups A–C complete.
- `spec-075` acceptance criteria AC-001…AC-009 met (manual console check is AC-007/AC-008/AC-009).
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` all pass.
- `CHANGELOG.md` updated.
- Commit: `fix(frontend): implement spec-075`.
