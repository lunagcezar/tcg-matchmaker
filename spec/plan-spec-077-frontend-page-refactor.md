# Plan — spec-077 Frontend Page Refactor

Maps spec requirements to concrete technical decisions and tasks. Order follows dependency graph; each composable follows RED→GREEN→REFACTOR.

## Technical Decisions

| #   | Decision                                                                                                           | Spec req         |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---------------- |
| D1  | `useCrudResource` lives in `src/composables/`; stores wrap it (no store factory)                                   | REQ-001..005     |
| D2  | `hasMore` derived from `nextCursor !== null`; ignore `meta.has_more`                                               | REQ-004          |
| D3  | `useCrudResource.loadMore()` reuses params captured by the last `list()`                                           | REQ-003          |
| D4  | `useLoadable`/`useStoreList` guard `onMounted` with `getCurrentInstance()` → SSR/test-safe, pristine Vitest output | REQ-009, GUD-001 |
| D5  | Shared `Participant` type in `src/types/domain.ts`; components import it                                           | REQ-011          |
| D6  | `useFormSubmit` covers create pages (q-form) and update pages (no form) via optional `validate`                    | REQ-007          |
| D7  | Keep store public APIs identical → existing store/page tests are the regression net                                | REQ-006          |
| D8  | `useTournamentBracket` maps bracket rows (DetailPage + ManagePage currently duplicate)                             | REQ-013          |
| D9  | No new `src/services/`; nothing reactive goes in `src/lib/`                                                        | CON-001          |

## Task Graph

```
T1 Participant type → domain.ts  (foundation, unblocks T5b/T8)
├─ T2 useCrudResource (tests first) → T3 useEventStore refactor → T4 useStoreStore refactor
├─ T5a useFormSubmit (tests first) → T5b create/update page refactors (uses T1 Participant? no—independent)
├─ T6 useLoadable (tests first) → T7 admin list page refactors
├─ T8 useParticipants (tests first) → T9 detail page refactors (uses T1)
├─ T10 useStoreList (tests first) → T11 list page refactors
└─ T12 useTournamentBracket (tests first) → T13 tournaments detail/manage bracket refactor
```

T2→T4 and T5..T12 are independent tracks; within each track sequential. T1 first.

## Task List

### T1 — Shared `Participant` type

- Add `interface Participant` to `src/types/domain.ts` (id, user_id?, username?, status?, role?).
- Update `ParticipantListCard.vue` + `ParticipantListSection.vue` to import and re-export for compat (`export type { Participant } from '@/types/domain'` keeps existing page imports working).
- Verify: `pnpm --filter @tcg/frontend typecheck`.

### T2 — `useCrudResource` (TDD)

- RED: `src/composables/__tests__/useCrudResource.test.ts` (stub `globalThis.fetch`).
  - `list` replaces items + sets cursor from `meta.next_cursor`
  - `loadMore` appends, no-ops when cursor null / already loading
  - `list` params reused by `loadMore` (assert query string contains both)
  - `create` throws `Error(j.error)` on API error; returns data on success
  - `get` sets `current`; `update` PATCHes `:id`; `reset` clears
  - `hasMore` flips false when `next_cursor: null`
- GREEN: implement `useCrudResource.ts` using `apiGet/apiPost/apiPatch`.
- Run tests.

### T3 — `useEventStore` refactor

- Rewrite `src/stores/useEventStore.ts` as setup store wrapping `useCrudResource<Event>({ endpoint: '/api/events' })` + `join/confirm/decline` via `apiPost`.
- Verify existing `stores/__tests__/useEventStore.test.ts` passes unchanged.

### T4 — `useStoreStore` refactor

- Rewrite `src/stores/useStoreStore.ts` wrapping `useCrudResource<Store>({ endpoint: '/api/stores' })` + `getMembers`.
- Add `stores/__tests__/useStoreStore.test.ts` covering list/loadMore/get/create/update/getMembers (no existing test file today).
- Verify store tests green.

### T5a — `useFormSubmit` (TDD)

- RED: `useFormSubmit.test.ts` — invalid validate → no submit; success → onSuccess + saving lifecycle; throw → error message + saving reset; default error extraction.
- GREEN: implement.

### T5b — Create/update page refactors

- `matches/CreatePage`, `tournaments/CreatePage`, `trading/CreatePage`, `stores/CreatePage`, `admin/TcgCreatePage`, `stores/SettingsPage` adopt `useFormSubmit`.
- Keep `saving`/`error` refs identical (templates untouched). Remove `formRef`-validate duplication only where present.
- Verify existing page tests (`CreatePages.test.ts`, `StoresTournamentsPages.test.ts`, `ManageAndSpecialPages.test.ts`) green.

### T6 — `useLoadable` (TDD)

- RED: `useLoadable.test.ts` — `load()` sets loading → data; `data` starts at `initial`; auto-loads when mounted in a component (mount wrapper via `@vue/test-utils`); no warning when called outside component.
- GREEN: implement with `getCurrentInstance()`-guarded `onMounted`.

### T7 — Admin list page refactors

- `StoreManageListPage`, `TcgListPage`, `UserListPage`, `ReportListPage`, `FormatListPage`, `AuditLogPage` adopt `useLoadable`; re-fetch via `load()` after mutations (TcgList delete, ReportList resolve/dismiss, UserList action, FormatList create).
- Verify existing admin page tests green.

### T8 — `useParticipants` (TDD)

- RED: `useParticipants.test.ts` — success populates; failure keeps `[]` without throwing; `loading` toggles.
- GREEN: implement.

### T9 — Detail page refactors

- `matches/DetailPage`, `trading/DetailPage`, `tournaments/DetailPage`, `tournaments/ManagePage` adopt `useParticipants`.
- `stores/DetailPage` stays on `getMembers` (different endpoint/auth).
- Verify detail page tests green.

### T10 — `useStoreList` (TDD)

- RED: `useStoreList.test.ts` — mount triggers `list`; `loadMore(index, done)` calls `resource.loadMore` and `done(!hasMore)`.
- GREEN: implement.

### T11 — List page refactors

- `matches/ListPage`, `tournaments/ListPage`, `trading/ListPage`, `stores/ListPage` adopt `useStoreList`.
- Verify list page tests green.

### T12 — `useTournamentBracket` (TDD)

- RED: `useTournamentBracket.test.ts` — maps `matches` rows (id, round_number, player1_id, player2_id, winner_id); tolerates missing/empty matches.
- GREEN: implement.

### T13 — Tournament bracket refactor

- `tournaments/DetailPage` + `tournaments/ManagePage` adopt `useTournamentBracket`.
- Verify green.

### T14 — Verification & commit

- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check`.
- Update `docs/` if needed + `CHANGELOG.md`.
- Commit: `refactor(frontend): extract generic page composables (spec-077)`.
