---
title: Standardize the Event Name Field Across Create Forms
version: 1.0
date_created: 2026-09-11
tags: frontend, spec, ui, events, i18n
---

# Introduction

Every event type (match, trading session, tournament) represents a created entity that needs a human-readable name, but the create forms are inconsistent: **matches have no name field at all**, the trading form labels its name field `event.type` ("Type"/"Tipo"), and the tournament form uses a bespoke `tournament.name` label ("Tournament Name"/"Nome do Torneio"). This spec standardizes the first field of every event create form to a shared, required **"Name"** label, adds the missing field to matches, and surfaces the match name in the list row and detail header so the new field is actually used.

## 1. Purpose & Scope

Add a consistent, required **Name** input as the first field of all three event create pages, backed by a single shared i18n key (`event.name`), and display the match name where it is currently omitted.

**In scope**

| Artifact                                              | Change                                                                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/i18n/en-US/index.ts` + `src/i18n/pt-BR/index.ts` | Add `event.name` ('Name' / 'Nome'); remove the now-unused `event.type` and `tournament.name` keys                      |
| `src/pages/matches/CreatePage.vue`                    | Add a required Name input as the **first** form field; bind `form.name`; include it in the create payload              |
| `src/pages/trading/CreatePage.vue`                    | Relabel the existing name input from `$t('event.type')` to `$t('event.name')` (field model `form.name` is unchanged)   |
| `src/pages/tournaments/CreatePage.vue`                | Relabel the existing name input from `$t('tournament.name')` to `$t('event.name')`                                     |
| `src/pages/matches/ListPage.vue`                      | Row shows `item.name` with fallback to the existing `tcg_name`/`anyTcg` display                                        |
| `src/pages/matches/DetailPage.vue`                    | Header title shows `match.name` with fallback to the existing `event.matchDetails` title                               |
| Frontend tests                                        | Update `CreatePages.test.ts` i18n messages; add assertions for the match name field and match list/detail name display |

**Out of scope**

- Backend / shared-schema changes: `CreateEventSchema.name` stays optional and `events.name` stays nullable (existing events have `NULL` names; the Worker accepts `name` for every type already). No DB migration.
- `stores/CreatePage.vue`: already has a Name field with `store.name` — unchanged.
- Events **edit** flows: no event edit page exists today; this spec does not add one.
- i18n backfill of the pre-existing hardcoded English validation messages in create forms (e.g. `'Name is required'`) — tracked as a separate follow-up (see spec-077 rationale).
- EventFeed / tournament & trading list rows: they already display `item.name` with fallbacks — only the match list row is missing it.

## 2. Definitions

- **Event**: A row in `events` with `type` ∈ `match` | `tournament` | `trading`; `name` is an existing nullable column already accepted by `CreateEventSchema`.
- **Label**: The visible `label` prop rendered by Quasar's `q-input`.
- **`event.name`**: The single shared i18n key used by all three event create forms for the name field.

## 3. Requirements, Constraints & Guidelines

### Shared i18n key

- **REQ-001**: Add `event.name` to both locales: `'Name'` (`en-US`) and `'Nome'` (`pt-BR`).
- **REQ-002**: Remove the now-unused keys `event.type` and `tournament.name` from both locale files **only if** no remaining template references them (verified: `event.type` is referenced solely by `trading/CreatePage.vue:13` and `tournament.name` solely by `tournaments/CreatePage.vue:13`; `event.type` as a _data field_ in `src/lib/router.ts` and `EventFeed.vue` is unrelated and unaffected).

### Create forms

- **REQ-003**: `matches/CreatePage.vue` adds a required Name `q-input` as the first field (`:label="$t('event.name')"`), bound to a new `form.name`, with the same required-rule convention as sibling fields (`:rules="[(v) => !!v || 'Name is required']"`). The create payload (spread `...form`) must send `name`.
- **REQ-004**: `trading/CreatePage.vue` changes the name field label from `$t('event.type')` to `$t('event.name')`; no model or rule change.
- **REQ-005**: `tournaments/CreatePage.vue` changes the name field label from `$t('tournament.name')` to `$t('event.name')`; no model or rule change.
- **REQ-006**: Field order is preserved everywhere: Name first, then the existing fields. For matches this makes Name the first field (currently the form starts with the date/time picker).

### Match name display

- **REQ-007**: `matches/ListPage.vue` row renders `item.name || item.tcg_name || $t('event.anyTcg')` (name takes precedence; existing fallbacks preserved).
- **REQ-008**: `matches/DetailPage.vue` `EventHeaderCard` title renders `(match as MatchDetails).name || $t('event.matchDetails')`.

### Constraints & guidelines

- **CON-001**: Do not change the shared `CreateEventSchema` or the Worker; `name` remains optional server-side.
- **CON-002**: Every new/changed user-facing label is served by an i18n key present in both `en-US` and `pt-BR`.
- **CON-003**: No production `any` types; keep `strict` TS.
- **GUD-001**: Follow TDD — write/extend tests first (RED), implement (GREEN), refactor. Existing page tests must stay green.
- **GUD-002**: The match `name` field rule message follows the existing inline convention (`'Name is required'`) for consistency with the surrounding fields; a full i18n pass over rule messages is explicitly out of scope.

## 4. Interfaces & Data Contracts

### i18n keys

```ts
// en-US
event: { name: 'Name', /* event.type removed */ }
// pt-BR
event: { name: 'Nome', /* event.type removed */ }

// tournament: { /* name removed */ }
```

### Match create form (first field)

```vue
<q-input
  v-model="form.name"
  :label="$t('event.name')"
  outlined
  :rules="[(v) => !!v || 'Name is required']"
/>
```

`form.name` is added to `reactive({ ... })` and is already included in the create payload via `store.create({ type: 'match', ...form, max_participants: Number(form.max_participants) })`.

### Match list row

```vue
<div class="text-body2">{{ item.name || item.tcg_name || $t('event.anyTcg') }}</div>
```

### Match detail title

```vue
<EventHeaderCard :title="(match as unknown as MatchDetails).name || $t('event.matchDetails')" ...>
```

## 5. Acceptance Criteria

- **AC-001**: Given the match create page, When rendered, Then a Name input is the first form field, bound to `form.name`, and labeled with `$t('event.name')`.
- **AC-002**: Given the match create form with an empty name, When submitted, Then the form does not call `store.create` (validation blocks) and the "Name is required" rule is active.
- **AC-003**: Given the match create form with a filled name, When submitted, Then `store.create` is called with an object containing `name`.
- **AC-004**: Given the trading create page, When rendered, Then the name field label is `$t('event.name')` (was `$t('event.type')`).
- **AC-005**: Given the tournament create page, When rendered, Then the name field label is `$t('event.name')` (was `$t('tournament.name')`).
- **AC-006**: Given `en-US` and `pt-BR` locale files, When `$t('event.name')` is resolved, Then it returns `'Name'` and `'Nome'` respectively; `event.type` and `tournament.name` are absent.
- **AC-007**: Given a match with `name` set, When the match list renders, Then the row shows the name (not the TCG name). Given a match with `name` null, the row falls back to `tcg_name`, then `anyTcg`.
- **AC-008**: Given a match with `name` set, When the match detail page renders, Then the header title shows the name; with `name` null it falls back to `event.matchDetails`.
- **AC-009**: Given the repository, When `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` run, Then all pass and no unused i18n keys remain.

## 6. Test Automation Strategy

- **Test Levels**: Component tests (Vitest + `@vue/test-utils`, `shallowMount`) and unit checks on the locale files.
- **Frameworks**: Vitest; existing test seams in `CreatePages.test.ts` and `MatchListPage.test.ts` (mocked stores via `vi.mock`, stubbed Quasar components, inline `createI18n` messages).
- **Actions (TDD order)**:
  - RED: Extend `CreatePages.test.ts` — add `event.name` to the inline i18n messages; add an assertion that the match create page renders a Name input (find by label or model) and that a filled submit calls `create` with `name`. Add/extend `MatchListPage.test.ts` to assert the row shows `item.name` when present. (These fail before the page changes.)
  - GREEN: implement the page + i18n changes.
  - Keep the trading/tournament/store create rendering tests green after the label change.
- **Test Data Management**: mock event rows already include `name` (see `MatchListPage.test.ts` fixtures); add a row with `name: null` to cover the fallback path.
- **CI/CD Integration**: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` in the pre-push pipeline (unchanged).
- **Coverage Requirements**: keep `pnpm test:coverage` thresholds unchanged.

## 7. Rationale & Context

The backend has supported a `name` for every event type since the events model was introduced (`CreateEventSchema.name` optional, nullable `events.name` column), and tournament/trading list rows already render `item.name`. Only the create UX is inconsistent:

- **Matches** never send a `name` (the form has no name field), so match rows are identified only by TCG name — users cannot give a match a meaningful title.
- **Trading** binds its first field to `form.name` but labels it `$t('event.type')` ("Type"/"Tipo"), which is misleading: it asks for the session type but stores a free-text name.
- **Tournament** uses `tournament.name` ("Tournament Name"), a one-off key that duplicates what a shared `event.name` would provide.

Standardizing on a single `event.name` label (Name/Nome) across all three create forms removes the duplicate/incorrect keys, makes the first field predictable for users, and aligns with the existing display behavior (`EventFeed`, tournament and trading list rows already show `name`). Making the field required on the client while leaving the schema optional preserves the API contract and existing `NULL`-name rows; existing API clients are unaffected.

Scope is deliberately limited to the create flow plus the two match-display touchpoints that make the new field useful. Full i18n of the inline validation-rule messages and an event-edit feature are separate follow-ups.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: None new — no Supabase schema or Worker changes.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: Existing `events.name` nullable column and `CreateEventSchema.name` optional field; matches created with a name now populate it.

### Technology Platform Dependencies

- **PLT-001**: Quasar `q-input`, Vue 3, vue-i18n (en-US/pt-BR message files), Vitest.

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

```vue
<!-- matches/CreatePage.vue — new first field -->
<q-form ref="formRef" class="q-gutter-sm" @submit.prevent="save">
  <q-input
    v-model="form.name"
    :label="$t('event.name')"
    outlined
    :rules="[(v) => !!v || 'Name is required']"
  />
  <DateTimePicker v-model="form.scheduled_at" ... />
  ...
```

```ts
// matches/CreatePage.vue — form now includes name
const form = reactive({
  name: '',
  scheduled_at: '',
  lat: 0,
  lng: 0,
  custom_location_name: '',
  max_participants: 2,
});
// payload already spreads ...form → sends { type: 'match', name, ... }
```

Edge cases:

- Match with `name: null` (all pre-existing matches): list row falls back to `tcg_name || anyTcg`; detail title falls back to `matchDetails`. No empty label rendered.
- Name with only whitespace: the `!!v` rule treats `'   '` as truthy — same behavior as the existing trading/tournament name rules; not tightened here (consistent with surrounding fields).
- API clients creating events without `name`: unaffected, since the Worker schema is unchanged.
- `event.type` i18n key removal must not affect `router.ts`/`EventFeed.vue`, which use `event.type` as a **data** field, not a translation key.

## 10. Validation Criteria

- `pnpm test` passes — new/extended create and match-list tests (RED → GREEN) and the full existing suite.
- `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` pass.
- No `event.type` / `tournament.name` references remain in templates or tests (grep check).
- `docs/` updated if behavior is documented (see §11); `CHANGELOG.md` notes the change.

## 11. Related Specifications / Further Reading

- `spec-077-frontend-page-refactor.md` — generic `useFormSubmit` used by these create forms; deferred i18n backfill of inline rule messages
- `spec-021-composables.md` / `spec-022-pinia-stores-and-tests.md` — frontend conventions referenced by the create pages
- `docs/requirements.md` — NFR-24/NFR-28e (i18n completeness) and NFR-28i (composable DRY)
- `docs/pages.md` — route map for the create pages
- Vue I18n: https://vue-i18n.intlify.dev/
