# Plan: spec-065-worker-domain-refactor

## Summary

Split 6 monolithic domain `index.ts` files into 3-layer structure (router/service/repository). Each domain's `index.ts` becomes a thin re-export. No behavioral changes. No test changes.

## Technical decisions

1. **Pass supabase client explicitly** — every repository and service function accepts `supabase: ReturnType<typeof createSecretClient>` as first arg. This keeps functions testable without `vi.mock` for the whole module.

2. **Keep rate-limit middleware in router.ts** — middleware decorators stay in the route definition; service functions don't know about them.

3. **Tournament `generateSingleEliminationBracket`** moves to `bracket-generators.ts` with the same signature as the other 4 generators.

4. **`orgGuardByMatch` stays in tournaments/service.ts** — it's a business-logic helper, not a DB query.

5. **`logAudit` stays in moderation/service.ts** — it's cross-cutting but specific to moderation domain.

6. **`slugify` stays in stores/service.ts** — domain-specific utility.

7. **Cursor pagination helpers stay in the service layer** of events/stores — not generic enough for a shared lib.

8. **Domain `index.ts` files become re-exports only** — all imports in `src/index.ts` continue to work unchanged.

## Order of implementation

All domains are independent — they can be done in any order. Recommended order (simplest → most complex):

1. notifications (120 lines, simple) → validate pattern works
2. tcgs (218 lines, 2 routers)
3. moderation (231 lines, 2 routers + audit helper)
4. stores (320 lines, pagination)
5. events (365 lines, pagination)
6. auth (280 lines, rate-limit middleware)
7. tournaments (506 lines, bracket generation + match management)

## Verification

- `pnpm test` — all 70+ worker tests pass
- `pnpm lint` — zero errors
- `grep -r "from.*index\.js" src/` — verify no broken imports
