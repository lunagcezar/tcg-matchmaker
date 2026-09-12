# Plan — spec-078 Event Name Standardization

Maps spec requirements to concrete tasks. TDD: each display/create change has a failing test first.

## Technical Decisions

| #   | Decision                                                                                                                                                                                                                             | Spec req         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| D1  | Shared `event.name` key ('Name'/'Nome'); remove `event.type` + `tournament.name` after pages relabel                                                                                                                                 | REQ-001, REQ-002 |
| D2  | Match create: `form.name` added to reactive; payload already spreads `...form` → sends `name`                                                                                                                                        | REQ-003          |
| D3  | Required rule message `'Name is required'` (inline, consistent with sibling fields; i18n pass is out of scope)                                                                                                                       | REQ-003, GUD-002 |
| D4  | Match list row: `item.name                                                                                                                                                                                                           |                  | item.tcg_name |     | anyTcg`; detail title: `name |     | matchDetails` | REQ-007, REQ-008 |
| D5  | No backend/schema change; `name` stays optional server-side                                                                                                                                                                          | CON-001          |
| D6  | Test seams: `CreatePages.test.ts` (mocked store + inline i18n), `MatchListPage.test.ts`, `MatchDetailPage.test.ts`; unknown `q-input`/`EventHeaderCard` elements render as custom elements/stubs so label/title props are assertable | —                |

## Task List

### T1 — i18n keys

- `en-US`/`pt-BR`: add `event.name` ('Name'/'Nome'); remove `event.type` and `tournament.name`.

### T2 — CreatePages.test.ts (RED for match name)

- Add `name: 'Name'` to the inline `event` messages.
- Add test: match create page renders a Name input first — `findAll('q-input')` includes an element with `attributes('label') === 'Name'`.
- Add test: `vm.form.name = 'My Match'; await vm.save();` → `mockEventStore.create` called with `objectContaining({ name: 'My Match' })` (q-form stubbed → `formRef` null → validation passes).
- Run → fails (no name field).

### T3 — matches/CreatePage (GREEN for T2)

- Add Name `q-input` as first field (`:label="$t('event.name')"`, `:rules="[(v) => !!v || 'Name is required']"`), `form.name: ''`.

### T4 — trading/CreatePage

- Relabel name field `$t('event.type')` → `$t('event.name')`.

### T5 — tournaments/CreatePage

- Relabel name field `$t('tournament.name')` → `$t('event.name')`.

### T6 — i18n cleanup

- Remove `type`/`tournament.name` from `CreatePages.test.ts` messages (pages no longer reference them); confirm no template/test references remain.

### T7 — MatchListPage.test.ts (RED)

- Update `BaseList` stub to render the item slot for each real item: `'<div><slot /><slot v-for="item in items" name="item" :item="item" /></div>'` with `props: ['items']`.
- Add test: first `.event-row` text contains `'Test Match'` (mock item already has `name`).
- Add test: a mock item with `name: null` renders its `tcg_name`.
- Run → fails (row currently shows TCG name).

### T8 — matches/ListPage (GREEN for T7)

- Row div: `{{ item.name || item.tcg_name || $t('event.anyTcg') }}`.

### T9 — MatchDetailPage.test.ts (RED)

- Stub `EventHeaderCard` to render/capture `title`; add a test with `current.name = 'Test Match'` asserting the header title is the name.
- Run → fails (title is `matchDetails`).

### T10 — matches/DetailPage (GREEN for T9)

- `EventHeaderCard :title="(match as unknown as MatchDetails).name || $t('event.matchDetails')"`.

### T11 — Verification & docs

- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check`.
- Grep: no `event.type`/`tournament.name` template or test references remain.
- Update `CHANGELOG.md`.
- Commit: `feat(frontend): standardize event name field on create forms (spec-078)`.
