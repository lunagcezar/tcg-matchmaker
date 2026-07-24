# Plan: spec-069-audit-remediation-p0

## Summary

Fix the P0 bugs and DRY/SOLID violations found in the audit: locale precedence, bracket round bug, tournament `best_of` type, remove production `any` types, centralize DB-client access via middleware, centralize response/validation helpers, and adopt shared role constants.

## Technical decisions

1. **Locale bug** — add parentheses in `boot/i18n.ts` so the conditional applies to the whole `storedLocale || navigator.language...` expression.
2. **Bracket round bug** — change `findAllMatchesByEvent` to iterate over all round IDs and return `{ rounds, matches }` containing all matches.
3. **Tournament `best_of` type** — change `BEST_OF_OPTIONS` to use numeric values and ensure the `q-select` emits a number.
4. **Remove `any`** — replace the index signatures in `useAdminStore.ts` and `useAccountManagement.ts` with `unknown` plus narrower response types, and remove the explicit `any` on `exportData`.
5. **DB client middleware** — create `src/middleware/db.ts` that attaches `createSecretClient(...)` to `c.var.db` once per request. Register it in `src/index.ts` before domain routes. Update all routers to use `c.var.db` instead of constructing the client.
6. **Response helpers** — create `src/lib/responses.ts` with standard envelope builders and status codes. Update all routers to use them.
7. **Validation helper** — create `src/lib/validation.ts` wrapping `schema.safeParse` and returning a normalized result. Update all services to use it and eliminate the duplicated `Validation failed: ...` strings.
8. **Role constants** — add `STORE_MEMBERSHIP_ROLES` to `packages/shared/src/constants.ts`. Replace all user-role and membership-role string literals in worker and frontend with these constants/types.
9. **`useAuthStore.fetchProfile`** — replace the raw `fetch` call with `apiGet('/api/auth/me')`, removing the duplicated base URL and auth header logic.
10. **Tests** — add regression tests for locale, bracket, and `best_of` before fixes. Keep all existing tests green.

## Order of implementation

1. **Shared constants** — add `STORE_MEMBERSHIP_ROLES` and update `Role` usages.
2. **Worker lib helpers** — create `responses.ts` and `validation.ts`.
3. **Worker DB middleware** — create `src/middleware/db.ts` and register it in `src/index.ts`.
4. **Worker routers** — convert all routers to use `c.var.db` and the new response/validation helpers.
5. **Worker services** — convert all services to use the validation helper.
6. **Worker bug fix** — fix `findAllMatchesByEvent` and add regression test.
7. **Frontend bug fixes** — locale, `best_of`, `any` types, `fetchProfile`.
8. **Frontend role constants** — replace role string literals.
9. **Lint and tests** — run `pnpm test` and `pnpm lint`, fix any issues.
10. **Docs** — update `CHANGELOG.md` and `AGENTS.md` with new conventions.

## Verification

- `pnpm test` — all worker and frontend tests pass.
- `pnpm lint` — zero errors and zero warnings.
- `rg -n "createSecretClient\(" packages/worker/src --type ts` — only matches in `db/client.ts` and `middleware/db.ts`.
- `rg -n "no-explicit-any" packages/frontend/src --type ts` — no matches.
- `rg -n "role: 'player' | 'organizer' | 'admin'" packages/worker/src packages/frontend/src --type ts` — no matches.
- Manual check: `localStorage.locale = 'en-US'` boots in English; `best_of` payload is numeric; bracket endpoint returns multi-round matches.
