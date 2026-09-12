---
title: Frontend Page Refactor — Generic CRUD, Form-Submit, and Data-Loading Composables
version: 1.0
date_created: 2026-09-11
tags: frontend, refactoring, composables, stores, dry
---

# Introduction

Multiple list, form, and detail pages repeat the same imperative data-flow logic: entity CRUD (`list`, `loadMore`, `get`, `create`, `update`), form submission (`save` with validation / `saving` / `error`), and "load data on mount" (`loadData`, `fetchX`, participant loading). This spec extracts that logic into generic, reusable composables under `src/composables/` and a shared CRUD resource, then rewires the pages and Pinia stores to consume them — reducing line count and centralizing behavior without changing any public API.

## 1. Purpose & Scope

Reduce duplicated frontend logic by introducing five generic composables and one shared type, and refactoring all affected pages and stores to use them.

**In scope**

| Artifact                                                 | Location                                                                                                                                                                                            | Replaces                                                                                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `useCrudResource` composable                             | `src/composables/useCrudResource.ts`                                                                                                                                                                | The ~80%-duplicated `list` / `loadMore` / `get` / `create` / `update` / pagination state in `useEventStore` and `useStoreStore` |
| `useEventStore` / `useStoreStore` refactor               | `src/stores/*.ts`                                                                                                                                                                                   | Thin Pinia wrappers around `useCrudResource` + their custom methods (`join`/`confirm`/`decline`, `getMembers`)                  |
| `useFormSubmit` composable                               | `src/composables/useFormSubmit.ts`                                                                                                                                                                  | `save()` boilerplate (`formRef.validate` / `saving` / `error` / try-catch-finally) in create/update pages                       |
| Create/update page refactors                             | `pages/matches/CreatePage.vue`, `pages/tournaments/CreatePage.vue`, `pages/trading/CreatePage.vue`, `pages/stores/CreatePage.vue`, `pages/admin/TcgCreatePage.vue`, `pages/stores/SettingsPage.vue` | Use `useFormSubmit`                                                                                                             |
| `useLoadable` composable                                 | `src/composables/useLoadable.ts`                                                                                                                                                                    | `loading` + `fetchX()` + `onMounted` in admin list pages                                                                        |
| Admin list page refactors                                | `pages/admin/StoreManageListPage.vue`, `TcgListPage.vue`, `UserListPage.vue`, `ReportListPage.vue`, `FormatListPage.vue`, `AuditLogPage.vue`                                                        | Use `useLoadable`                                                                                                               |
| `useParticipants` composable + shared `Participant` type | `src/composables/useParticipants.ts`, `src/types/domain.ts`                                                                                                                                         | Duplicated participant loading in detail pages and two duplicated `Participant` interfaces                                      |
| Detail page refactors                                    | `pages/matches/DetailPage.vue`, `pages/trading/DetailPage.vue`, `pages/tournaments/DetailPage.vue`, `pages/tournaments/ManagePage.vue`                                                              | Use `useParticipants` (and optionally `useTournamentBracket`)                                                                   |
| `useStoreList` composable                                | `src/composables/useStoreList.ts`                                                                                                                                                                   | The repeated `loadMore(index, done)` wrapper + `onMounted(list)` in the four list pages                                         |
| List page refactors                                      | `pages/matches/ListPage.vue`, `pages/tournaments/ListPage.vue`, `pages/trading/ListPage.vue`, `pages/stores/ListPage.vue`                                                                           | Use `useStoreList`                                                                                                              |
| `useTournamentBracket` composable (secondary)            | `src/composables/useTournamentBracket.ts`                                                                                                                                                           | Duplicated `loadBracket()` mapping in `tournaments/DetailPage.vue` and `tournaments/ManagePage.vue`                             |

**Out of scope**

- Creating a `src/services/` folder — **rejected**, see §7 Rationale.
- Moving reactivity-bearing helpers into `src/lib/` — **rejected**, `lib/` is pure-function-only per AGENTS.md.
- Worker changes — the pagination contract (`meta.next_cursor`) is already consistent across `events` and `stores` list endpoints (verified: `events/service.ts:73` and `stores/service.ts:64` both return `next_cursor`).
- Auth pages (`LoginPage`, `SignupPage`, `OnboardingPage`) — bespoke validation/feedback flows, different pattern.
- `pages/SettingsPage.vue` account-management section and `pages/admin/StoreManageDetailPage.vue` dialog flows — retained as-is; `StoreManageDetailPage.handleUpdate` may optionally adopt `useFormSubmit` (marked optional in REQ).
- Backfilling i18n keys for pre-existing hardcoded English fallback strings in create pages — documented as a follow-up, not retrofitted here.

## 2. Definitions

- **CRUD resource**: The reactive state + methods needed to list (paginated), fetch, create, and update a single entity type against one REST endpoint.
- **Cursor pagination**: `GET /api/<resource>` returns `{ data, error, meta: { next_cursor } }`; `next_cursor === null` means no more pages.
- **Composable**: A function named `use*` in `src/composables/` that may hold Vue reactive state and side effects (see AGENTS.md "Composables").
- **`lib/`**: `src/lib/` — pure functions only (formatting, colors, routing, locale detection), no Vue reactivity.
- **`Participant`**: The row shape rendered by `ParticipantListCard` / `ParticipantListSection` (`id`, `user_id?`, `username?`, `status?`, `role?`).

## 3. Requirements, Constraints & Guidelines

### `useCrudResource` — shared entity CRUD + pagination

- **REQ-001**: `useCrudResource(options)` accepts `{ endpoint: string; limit?: number }` and returns the reactive state `{ items, loading, loadingMore, hasMore, nextCursor, current }` and actions `{ list, loadMore, get, create, update, reset }`.
- **REQ-002**: `list(params?)` replaces `items`, resets `nextCursor`, records `params` for later reuse, sets `loading`, and fetches the first page from `GET {endpoint}`.
- **REQ-003**: `loadMore()` appends the next page using `nextCursor`; it reuses the `params` from the last `list()` call unless overridden; it no-ops when `nextCursor` is null or `loadingMore` is true. No page passes params to `loadMore` anymore.
- **REQ-004**: `hasMore` is derived as `nextCursor !== null`. The `stores` API's redundant `meta.has_more` is ignored (verified equivalent to `nextCursor !== null` in `stores/service.ts:55-59`).
- **REQ-005**: `create(input)` POSTs to `{endpoint}` and throws `Error(j.error)` when the API returns an error; `update(id, input)` PATCHes `{endpoint}/{id}`; `get(id)` GETs `{endpoint}/{id}` and sets `current`; `reset()` clears `items` and `nextCursor`.

### Store refactor (behavior-preserving)

- **REQ-006**: `useEventStore` and `useStoreStore` expose the **same public API surface as today** — every existing caller and test keeps working unchanged. Each becomes a setup store that calls `useCrudResource` and adds its custom methods (`join`/`confirm`/`decline`; `getMembers`).

### `useFormSubmit` — form save boilerplate

- **REQ-007**: `useFormSubmit(options)` accepts `{ validate?, submit, onSuccess?, errorMessage? }` and returns `{ saving, error, save }`. `save()` runs optional `validate()`, guards on `false`, clears `error`, sets `saving`, awaits `submit()`, then `onSuccess()`, catching errors into `error` (default message extraction `e instanceof Error ? e.message : 'Something went wrong'`), and always resets `saving`.

### `useLoadable` — fetch-on-mount

- **REQ-008**: `useLoadable<T>(fetcher, initial)` returns `{ data, loading, load }` where `data` starts as `initial`, `load()` sets `loading`, awaits `fetcher()`, assigns the result, and auto-runs on `onMounted`. `load()` is also exposed for explicit re-fetches (e.g., after a delete).
- **REQ-009**: `useLoadable` must not read `window`/`localStorage`/`navigator` (SSR/test-safe per AGENTS.md).

### `useParticipants` + shared type

- **REQ-010**: `useParticipants(entityId)` returns `{ participants, loading, loadParticipants }`, fetching `GET /api/events/{entityId}/participants` and swallowing errors (current behavior — detail pages render an empty list on failure).
- **REQ-011**: A single `Participant` interface `{ id: string; user_id?: string; username?: string; status?: string; role?: string }` lives in `src/types/domain.ts`. `ParticipantListCard.vue` and `ParticipantListSection.vue` import it instead of exporting their own.

### `useStoreList` — list page wiring

- **REQ-012**: `useStoreList(source, params?)` returns `{ loadMore }`, where `loadMore(index, done)` calls `source.loadMore()` and resolves `done(!source.hasMore)`, and `onMounted` triggers `source.list(params)` once. `items`/`loading` are **not** returned because Pinia unwraps refs on the store instance — pages already source them reactively via `computed(() => store.items)` (existing behavior preserved).

### `useTournamentBracket` (secondary)

- **REQ-013**: `useTournamentBracket(tournamentId)` returns `{ matches, loading, loadBracket }`, encapsulating the `GET /api/tournaments/{id}/bracket` fetch + row mapping currently duplicated in `tournaments/DetailPage.vue` and `tournaments/ManagePage.vue`.

### Constraints & guidelines

- **CON-001**: Do **not** create `src/services/`; do **not** add Vue-reactivity-bearing logic to `src/lib/`. Reusable API/state logic lives in `src/composables/`.
- **CON-002**: No production `any` types (use `unknown` / generics / `as Type` casts). Strict TS stays on.
- **CON-003**: Pages stay ≤ 200 lines; this refactor must not grow them.
- **GUD-001**: Composables named with `use` prefix; accept refs/getters when input should be reactive; clean up side effects in `onUnmounted` where applicable.
- **GUD-002**: New user-facing strings use `$t()`/`useI18n` in both `en-US` and `pt-BR`.
- **GUD-003**: Follow TDD: write the composable tests first (RED), then implement, then refactor the pages (GREEN), keeping every existing test green.
- **PAT-001**: Test seam = mocked `globalThis.fetch` (existing convention in `useEventStore.test.ts`, `useAdminStore.test.ts`).

## 4. Interfaces & Data Contracts

### `useCrudResource`

```ts
// src/composables/useCrudResource.ts
export interface CrudResourceOptions {
  endpoint: string; // e.g. '/api/events'
  limit?: number; // page size sent as ?limit= (default 20)
}

export function useCrudResource<T>(options: CrudResourceOptions): {
  items: Ref<T[]>;
  loading: Ref<boolean>;
  loadingMore: Ref<boolean>;
  hasMore: Ref<boolean>;
  nextCursor: Ref<string | null>;
  current: Ref<T | null>;
  list: (params?: Record<string, string>) => Promise<void>;
  loadMore: () => Promise<void>;
  get: (id: string) => Promise<T | null>;
  create: (input: Record<string, unknown>) => Promise<unknown>;
  update: (id: string, input: Record<string, unknown>) => Promise<unknown>;
  reset: () => void;
};
```

### Refactored stores (public API unchanged)

```ts
// src/stores/useEventStore.ts
export const useEventStore = defineStore('events', () => {
  const base = useCrudResource<Event>({ endpoint: '/api/events' });
  async function join(id: string) {
    return (await apiPost(`/api/events/${id}/join`)).data;
  }
  async function confirm(id: string) {
    /* ... */
  }
  async function decline(id: string) {
    /* ... */
  }
  return { ...base, join, confirm, decline };
});
```

```ts
// src/stores/useStoreStore.ts
export const useStoreStore = defineStore('stores', () => {
  const base = useCrudResource<Store>({ endpoint: '/api/stores' });
  async function getMembers(storeId: string) {
    const j = await apiGet(`/api/stores/${storeId}/members`);
    return (j.data ?? []) as StoreMembership[];
  }
  return { ...base, getMembers };
});
```

Note: `hasMore`, `items`, etc. are `Ref`s inside the setup store and Pinia unwraps them on the store instance — same as today.

### `useFormSubmit`

```ts
export function useFormSubmit(options: {
  validate?: () => Promise<boolean> | boolean;
  submit: () => Promise<void> | void;
  onSuccess?: () => Promise<void> | void;
  errorMessage?: (e: unknown) => string;
}): { saving: Ref<boolean>; error: Ref<string>; save: () => Promise<void> };
```

### `useLoadable`

```ts
export function useLoadable<T>(
  fetcher: () => Promise<T>,
  initial: T,
): { data: Ref<T>; loading: Ref<boolean>; load: () => Promise<void> };
```

### `useParticipants`

```ts
export function useParticipants(entityId: string): {
  participants: Ref<Participant[]>;
  loading: Ref<boolean>;
  loadParticipants: () => Promise<void>;
};
```

### `useStoreList`

```ts
export interface StoreListSource {
  hasMore: boolean;
  list: (params?: Record<string, string>) => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useStoreList(
  source: StoreListSource,
  params?: Record<string, string>,
): { loadMore: (index: number, done: (stop?: boolean) => void) => void };
```

`items`/`loading` remain sourced from the Pinia store (unwrapped refs are already reactive on the store instance).

### Shared type

```ts
// src/types/domain.ts
export interface Participant {
  id: string;
  user_id?: string;
  username?: string;
  status?: string;
  role?: string;
}
```

## 5. Acceptance Criteria

- **AC-001**: Given a paginated list API returning `meta.next_cursor`, When a page calls `resource.list()` then `resource.loadMore()`, Then `items` appends and `hasMore`/`nextCursor` update; `loadMore()` no-ops once `nextCursor` is null.
- **AC-002**: Given the refactored `useEventStore` / `useStoreStore`, When existing pages and the existing `useEventStore.test.ts` (and any store test) run, Then all public methods (`list`, `loadMore`, `get`, `create`, `update`, `join`, `confirm`, `decline`, `getMembers`, `reset`, `hasMore`, `items`, `loading`, `current`) behave identically and all tests pass without modification.
- **AC-003**: Given a create page using `useFormSubmit` with an invalid form, When `save()` runs, Then no request is issued, `saving` stays false and `error` is cleared.
- **AC-004**: Given a create page using `useFormSubmit`, When `submit()` succeeds, Then `onSuccess()` runs (e.g. `router.push`) and `saving` resets to false.
- **AC-005**: Given `useFormSubmit` with a throwing `submit()`, When `save()` runs, Then `error` is populated with the extracted message and `saving` resets to false.
- **AC-006**: Given an admin list page using `useLoadable`, When mounted, Then `load()` runs once, `loading` toggles, and `data` holds the fetched rows.
- **AC-007**: Given a detail page using `useParticipants`, When `loadParticipants()` resolves, Then `participants` is populated; on fetch failure `participants` stays `[]` without throwing.
- **AC-008**: Given `ParticipantListCard.vue` / `ParticipantListSection.vue`, When compiled, Then both import `Participant` from `src/types/domain.ts` and export no local `Participant` interface.
- **AC-009**: Given a list page using `useStoreList`, When the `BaseList` emits `@load-more`, Then `resource.loadMore()` runs and `done(!hasMore)` is invoked.
- **AC-010**: Given `src/services/` does not exist and `src/lib/` gains no reactive code, When the refactor lands, Then no new folder pattern is introduced (per CON-001).
- **AC-011**: Given the full repository, When `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, and `pnpm format:check` run, Then all pass and no new `any` types were introduced.

## 6. Test Automation Strategy

- **Test Levels**: Unit tests for the new composables; existing store and page tests act as regression guards for the refactors.
- **Frameworks**: Vitest + `@vue/test-utils` (existing setup). Test seam: stub `globalThis.fetch` returning `{ json: () => Promise.resolve({ data, error, meta }) }` (see `useEventStore.test.ts`).
- **New test files** (TDD order, RED first):
  - `src/composables/__tests__/useCrudResource.test.ts` — `list` replaces items; `loadMore` appends + stops at null cursor; `list` params reused by `loadMore`; `create` throws on API error; `get`/`update`/`reset`.
  - `src/composables/__tests__/useFormSubmit.test.ts` — validation gate, success → `onSuccess`, failure → `error`, `saving` lifecycle.
  - `src/composables/__tests__/useLoadable.test.ts` — auto-load on mount (mounted via a stub component or calling `load()` directly), `loading` toggling.
  - `src/composables/__tests__/useParticipants.test.ts` — success populates, failure keeps `[]`.
  - `src/composables/__tests__/useStoreList.test.ts` — mount triggers `list`; `loadMore` resolves `done`.
  - `src/composables/__tests__/useTournamentBracket.test.ts` — bracket mapping, no-match tolerance.
- **Existing suites that must remain green without modification**: `stores/__tests__/useEventStore.test.ts` (and any store tests), `pages/__tests__/*` page tests, component tests referencing `Participant`.
- **Coverage Requirements**: keep `pnpm test:coverage` thresholds unchanged.
- **CI/CD Integration**: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` in the pre-push pipeline (unchanged).

## 7. Rationale & Context

The user asked whether `save`, entity, `loadMore`, and `loadData` could be genericized in `lib/`, or whether a new `services/` folder is the right home.

**Why not `src/lib/`?** AGENTS.md defines `lib/` as "pure functions, no Vue reactivity" (formatting, colors, routing, locale detection). The logic in question is inherently stateful and reactive (refs for `items`/`loading`/`saving`, `computed hasMore`, lifecycle hooks in `onMounted`). Placing it in `lib/` would violate the documented contract and break the SSR/test-safe purity guarantee that `lib/` is audited for.

**Why not `src/services/`?** The repo convention already answers where stateless API logic lives: "Stateless API logic goes in **composables** or direct `api*` calls from stores" (AGENTS.md). `useAdminStore.ts` and `useAccountManagement.ts` already fill the "service" role as composables. Introducing a parallel `services/` folder would fragment the codebase into two competing patterns for the same responsibility and require updating AGENTS.md, aliases (`@/`), and review conventions for no benefit.

**Why `src/composables/`?** Composables are the established, documented home for reusable reactive logic in this app (`useFormatDate`, `usePageMeta`, `useGeocode`, `useBracketD3`). The new helpers are exactly that: `useCrudResource` (shared CRUD state used _inside_ Pinia stores), `useFormSubmit`, `useLoadable`, `useParticipants`, `useStoreList`. Each follows the existing `use` prefix, ref-getter input, and cleanup conventions. The result also strengthens the DRY guidelines from `spec-069`/`spec-070`.

Additional context:

- `hasMore` is unified on `nextCursor !== null` because both list endpoints expose `next_cursor`; the `stores` response's `has_more` is redundant and can be ignored without behavior change.
- Keeping the store public APIs identical makes the refactor verifiable purely through the existing tests (no page test rewrites required beyond the composable adoption).

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: None new — Supabase/Worker API contracts unchanged.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: Existing pagination contract (`meta.next_cursor`) on `GET /api/events` and `GET /api/stores`; participants endpoint `GET /api/events/:id/participants`; bracket endpoint `GET /api/tournaments/:id/bracket`. No schema changes.

### Technology Platform Dependencies

- **PLT-001**: Vue 3 Composition API, Pinia setup stores, Vitest, `@vue/test-utils`, `@tcg/shared` types (`Event`, `Store`, `StoreMembership`).

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

### Create page before / after

```vue
<!-- before (matches/CreatePage.vue script) -->
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);
const saving = ref(false);
const error = ref('');
async function save() {
  const valid = formRef.value ? await formRef.value.validate() : true;
  if (!valid) return;
  saving.value = true;
  error.value = '';
  try {
    await store.create({ type: 'match', ...form, max_participants: Number(form.max_participants) });
    void router.push('/matches');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create match';
  } finally {
    saving.value = false;
  }
}

<!-- after -->
const { saving, error, save } = useFormSubmit({
  validate: () => formRef.value?.validate() ?? true,
  submit: () =>
    store.create({ type: 'match', ...form, max_participants: Number(form.max_participants) }),
  onSuccess: () => router.push('/matches'),
});
```

### Admin list page before / after

```vue
<!-- before (TcgListPage.vue script) -->
const tcgs = ref<TcgRow[]>([]);
const loading = ref(false);
async function fetchTcgs() {
  loading.value = true;
  try { const b = await apiGet('/api/tcgs'); tcgs.value = (b.data ?? []) as TcgRow[]; }
  finally { loading.value = false; }
}
onMounted(fetchTcgs);

<!-- after -->
const { data: tcgs, loading, load } = useLoadable(
  () => apiGet('/api/tcgs').then((b) => (b.data ?? []) as TcgRow[]),
  [] as TcgRow[],
);
// deleteSelected(): ... await apiDelete(...); await load();
```

### Edge cases

- `list()` called twice: second call replaces `items` and resets cursor (list pages refresh from scratch on mount).
- `loadMore()` with no prior `list()`: `nextCursor` is null → no-op.
- Store API returns `next_cursor: null` with `has_more: false` → `hasMore` false; with `next_cursor` set and `has_more: true` → `hasMore` true; the frontend only reads `next_cursor`.
- `useFormSubmit` without a `q-form` (e.g., `TcgCreatePage`, `stores/SettingsPage`): omit `validate`; manual field checks can live inside `submit` or in `validate`.
- `useParticipants` for a store detail page is NOT adopted — store members use `storeStore.getMembers` (different endpoint and authorization), so `stores/DetailPage.vue` keeps its current flow.
- `Participant.role` is used only by `ParticipantListCard` with `badge-key="role"` (stores members); making it optional keeps both components satisfied.
- `useLoadable` must not auto-run when used in non-component contexts; tests may call `load()` directly and assert `loading` transitions.

## 10. Validation Criteria

- `pnpm test` passes — new composable unit tests (RED → GREEN) and the entire existing suite unchanged.
- `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` pass.
- No new `src/services/` folder; `src/lib/` gains no reactive code (AC-010).
- Every affected page still ≤ 200 lines and its behavior is unchanged (verified by existing page tests).
- `docs/` updated if any documented convention changes; `CHANGELOG.md` notes the refactor.

## 11. Related Specifications / Further Reading

- `spec-021-composables.md` — composable conventions (`use` prefix, ref inputs)
- `spec-022-pinia-stores-and-tests.md` — store conventions and store test patterns
- `spec-048-client-refactoring.md` — prior API layer / store consolidation (removed dead composables, moved state to Pinia)
- `spec-064-pagination-remember-me-login-identifier-store-location.md` — cursor pagination design
- `spec-069-audit-remediation-p0.md` / `spec-070-audit-remediation-p1.md` — DRY & quality guidelines that this refactor strengthens
- `spec-072-detail-page-card-refactor.md` — `ParticipantListCard` / detail layouts
- AGENTS.md — Composables, Stores, `src/lib/` definitions, Frontend DRY & Quality Guidelines
