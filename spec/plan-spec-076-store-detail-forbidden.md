# plan-spec-076-store-detail-forbidden

## 1. Goal

Execute `spec-076-store-detail-forbidden` (v2.0, private direction): keep the store members roster member-only, add an admin bypass, expose `viewer_role` on the public store detail response via optional auth, and gate the members card in `stores/DetailPage.vue` on it — eliminating the 401/403 on `/stores/:id` for non-members without making the roster public.

## 2. Parallelizable Task Groups

### Group A — Worker auth middleware (front/back of the pipeline)

- A1. Extract `resolveUser(c): Promise<AuthUser | null>` in `packages/worker/src/middleware/auth.ts` from `authMiddleware` (DRY).
- A2. Add `optionalAuthMiddleware(c, next)` that sets `c.var.user` when `resolveUser` succeeds and always calls `next()` (anonymous passes through; banned/deleted → no user).
- A3. Tests in `packages/worker/src/middleware/__tests__/auth.test.ts` + new `optionalAuth` describe block.

### Group B — Worker store service + router (depends on A)

- B1. `getStore(supabase, id, viewer?)` returns `{ ...StoreSchema.parse(data), viewer_role }`; role lookup via `findStoreMembership`, `'admin'` for admins.
- B2. `getMembers(supabase, user, storeId)` keeps the membership gate but skips it for admins.
- B3. `router.ts`: `GET /:id` gains `optionalAuthMiddleware`; `GET /:id/members` passes `c.var.user` to `getMembers`.
- B4. Tests in `packages/worker/src/stores/__tests__/index.test.ts` (viewer_role cases, admin members bypass, retained 401/403).

### Group C — Frontend store detail gating (parallel with A/B)

- C1. `stores/DetailPage.vue` renders the members card and calls `getMembers` only when `store.viewer_role` is truthy.
- C2. New component test `packages/frontend/src/pages/__tests__/StoreDetailPage.test.ts` (or extend existing) asserting the gating.

### Group D — Verification & commit (depends on A+B+C)

- D1. `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check`.
- D2. Update `docs/requirements.md` (if affected) + `CHANGELOG.md`.
- D3. Commit `fix(worker): implement spec-076` (frontend change rides along) or a combined scoped commit.

## 3. Task Order / Dependencies

```
A (middleware) ─► B (stores) ─┐
C (frontend) ────────────────┼─► D (verify + commit)
```

A must precede B (B uses `optionalAuthMiddleware`). C is independent of A/B.

## 4. Technical Decisions

- **`resolveUser` shared helper**: both middlewares reuse one user-resolution path (Bearer parse → `auth.getUser` → `users` row → deleted/banned filtering) — keeps auth semantics identical and satisfies AGENTS.md DRY.
- **`viewer_role` naming**: snake_case, response-only; attached after `StoreSchema.parse` (Zod strips unknown keys), never persisted, never added to shared schema.
- **Admin bypass in `getMembers`**: admins read any store's roster (fixes the empty members list on `/admin/stores/:id`); role check via `ROLES[2]`.
- **Frontend gating**: `Boolean(store.value?.viewer_role)` controls both the card render and the `getMembers` call — non-members never fire the request, so no 401/403 occurs.
- **Frontend `Store` type**: `viewer_role` is read off the API response via a local cast; the shared `Store` type is unchanged.

## 5. Testing Strategy

- Worker: middleware tests (anonymous/valid/banned/deleted through `optionalAuthMiddleware`); store route tests (`viewer_role` anonymous/member/admin, admin members 200, non-member members 403, anonymous members 401).
- Frontend: `DetailPage` shallow-mount test with mocked `useStoreStore` verifying the members card and `getMembers` call appear only when `viewer_role` is set.
- TDD: RED first for each behavior, watch it fail, then implement.

## 6. Risks & Mitigations

| Risk                               | Mitigation                                                     |
| ---------------------------------- | -------------------------------------------------------------- |
| `authMiddleware` behavior drift    | `resolveUser` extraction keeps all 5 existing auth tests green |
| Leaking membership to anonymous    | `viewer_role` only set when `optionalAuth` resolves a user     |
| Frontend regression on member view | New DetailPage test covers member vs non-member rendering      |
| Shared schema pollution            | `viewer_role` attached post-parse only, not in `StoreSchema`   |

## 7. Definition of Done

- All tasks A–D complete; `spec-076` acceptance criteria AC-001…AC-010 met.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` pass.
- `CHANGELOG.md` (and `docs/requirements.md` if affected) updated.
- Commit: `fix(worker): implement spec-076`.
