# plan-spec-070-audit-remediation-p1

## 1. Goal

Execute `spec-070-audit-remediation-p1`: DRY the frontend UI, split large pages, complete shared types/schemas, add geocoding schemas, adopt Luxon formatting, and fill i18n gaps while keeping all quality gates green.

## 2. Parallelizable Task Groups

### Group A — Atoms & Molecules (parallel)

- A1. Create `StatusBadge` atom.
  - File: `packages/frontend/src/components/atoms/StatusBadge.vue`
  - Inputs: `status: string`, optional `i18nPrefix: string`.
  - Outputs: colored `q-badge` with translated label.
  - Colors: open/confirmed/completed/cancelled/pending/resolved/dismissed/active/inactive.
  - Tests: `packages/frontend/src/components/atoms/__tests__/StatusBadge.spec.ts`

- A2. Create `ConfirmDeleteDialog` molecule.
  - File: `packages/frontend/src/components/molecules/ConfirmDeleteDialog.vue`
  - Props: `title`, `message`, `confirmLabel`, `confirmColor`.
  - Emits: `confirm`, `cancel`.
  - Tests: `packages/frontend/src/components/molecules/__tests__/ConfirmDeleteDialog.spec.ts`

- A3. Create `DateTimePicker` molecule.
  - File: `packages/frontend/src/components/molecules/DateTimePicker.vue`
  - Props: `modelValue: string` (ISO), `label: string`.
  - Internal state: date string, time string; combine to ISO on change.
  - Tests: `packages/frontend/src/components/molecules/__tests__/DateTimePicker.spec.ts`

- A4. Create `StatusFilterSegment` molecule.
  - File: `packages/frontend/src/components/molecules/StatusFilterSegment.vue`
  - Props: `modelValue`, `options` array of `{ label, value, icon }`.
  - Emits: `update:modelValue`.
  - Replaces repeated `.filter-segment` markup.

- A5. Create `EventRow` molecule.
  - File: `packages/frontend/src/components/molecules/EventRow.vue`
  - Props: `to` (route string).
  - Renders a styled `router-link` with a slot for row content.

### Group B — Organisms (depends on A)

- B1. Create `BaseList` organism.
  - File: `packages/frontend/src/components/organisms/BaseList.vue`
  - Generic over an item with `{ id: string }`.
  - Props: `items`, `loading`, `emptyText`, optional `scrollTarget`.
  - Emits: `load-more`.
  - Uses `MapListLayout` scroll target via provide/inject for `q-infinite-scroll`.
  - Tests: `packages/frontend/src/components/organisms/__tests__/BaseList.spec.ts` (optional)

- B2. Create `ProfileSettingsSection` organism.
  - File: `packages/frontend/src/components/organisms/settings/ProfileSettingsSection.vue`
  - Owns profile form + save.

- B3. Create `PasswordSettingsSection` organism.
  - File: `packages/frontend/src/components/organisms/settings/PasswordSettingsSection.vue`
  - Owns password change form.

- B4. Create `DangerZoneSection` organism.
  - File: `packages/frontend/src/components/organisms/settings/DangerZoneSection.vue`
  - Owns delete, suspend, export actions.

- B5. Create `TournamentManageHeader` organism.
  - File: `packages/frontend/src/components/organisms/tournament/TournamentManageHeader.vue`
  - Props: tournament, status actions.

- B6. Create `ParticipantListSection` organism.
  - File: `packages/frontend/src/components/organisms/tournament/ParticipantListSection.vue`
  - Props: participants, tournament status.
  - Emits: register/check-in/walkover.

- B7. Create `BracketMatchSection` organism.
  - File: `packages/frontend/src/components/organisms/tournament/BracketMatchSection.vue`
  - Props: bracket matches.
  - Emits: report result.

### Group C — Shared schemas/types (parallel with A/B)

- C1. Add `EventSchema`, `MatchSchema`, `TradingSessionSchema` to `packages/shared/src/schemas/event.ts`.
- C2. Add `GeocodeQuerySchema` and `GeocodeResultSchema` to `packages/shared/src/schemas/geocoding.ts`.
- C3. Export inferred types from `packages/shared/src/types/index.ts`.
- C4. Re-export new schemas/types from `packages/shared/src/index.ts`.
- C5. Update worker geocoding route to use `GeocodeQuerySchema` and `GeocodeResultSchema`.
- C6. Update worker to use `EventSchema`/`MatchSchema`/`TradingSessionSchema` as appropriate (internal response shapes).

### Group D — Formatting & i18n (parallel with A/B)

- D1. Create `useFormatDate` composable.
  - File: `packages/frontend/src/composables/useFormatDate.ts`
  - Uses Luxon and locale from `useAppStore`.
- D2. Replace all direct date formatting in pages with `useFormatDate`.
- D3. Add missing en-US/pt-BR i18n keys.
- D4. Update `FilterBar.vue` to use i18n keys.

### Group E — Page Refactoring (depends on A/B)

- E1. Refactor `packages/frontend/src/pages/IndexPage.vue` to use `BaseList` + `EventRow` + `StatusFilterSegment`.
- E2. Refactor `packages/frontend/src/pages/matches/ListPage.vue` to use `BaseList` + `EventRow` + `StatusFilterSegment`.
- E3. Refactor `packages/frontend/src/pages/trading/ListPage.vue` to use `BaseList` + `EventRow`.
- E4. Refactor `packages/frontend/src/pages/tournaments/ListPage.vue` to use `BaseList` + `EventRow`.
- E5. Refactor `packages/frontend/src/pages/stores/ListPage.vue` to use `BaseList`.
- E6. Refactor `packages/frontend/src/pages/SettingsPage.vue` to use new organisms and keep ≤ 200 lines.
- E7. Refactor `packages/frontend/src/pages/tournaments/ManagePage.vue` to use new organisms and keep ≤ 200 lines.
- E8. Refactor admin list pages (`TcgListPage`, `UserListPage`, `ReportListPage`, `StoreManageListPage`, `AuditLogPage`, `FormatListPage`) to use `StatusBadge` and `ConfirmDeleteDialog`.
- E9. Update create forms (`matches/CreatePage`, `trading/CreatePage`, `tournaments/CreatePage`) to use `DateTimePicker`.

### Group F — Cleanup & Verification (depends on A-E)

- F1. Remove duplicated local types that are now available from `@tcg/shared`.
- F2. Update `CHANGELOG.md`.
- F3. Update `AGENTS.md` if component rules or shared surface changed.
- F4. Run `pnpm test` and fix failures.
- F5. Run `pnpm lint` and fix issues.
- F6. Run `pnpm -F @tcg/frontend typecheck` and fix issues.
- F7. Commit with `feat(frontend): implement spec-070` after all green.

## 3. Task Order / Dependencies

```
A (atoms/molecules) ───┬──┐
C (shared)             │  │
D (format/i18n)          │  └──► B (organisms) ──► E (pages) ──► F (verify)
```

Best execution order:

1. Start A, C, D in parallel (they do not depend on each other).
2. Once A is done, start B.
3. Once B is done, start E.
4. F runs after E.

## 4. Testing Strategy

- Add/expand component tests for every new atom/molecule/organism.
- Add unit test for `useFormatDate`.
- Keep existing worker tests green; update any worker tests affected by schema changes.
- Run full quality gates before committing.

## 5. Risks & Mitigations

| Risk                                 | Mitigation                                                 |
| ------------------------------------ | ---------------------------------------------------------- |
| File moves break imports             | Let `vue-tsc` and `pnpm test` catch them; fix iteratively. |
| Missing i18n keys break UI           | Add keys before consuming them; run tests.                 |
| Shared schema changes break frontend | Keep local types in sync; remove duplication after green.  |
| Page size still > 200 lines          | Split into smaller organisms; repeat until size passes.    |

## 6. Definition of Done

- All tasks in groups A–F are complete.
- `spec-070` acceptance criteria are met.
- `pnpm test`, `pnpm lint`, and `pnpm -F @tcg/frontend typecheck` pass.
- `CHANGELOG.md` and `AGENTS.md` are updated if behavior/docs changed.
- A single conventional commit `feat(frontend): implement spec-070` is made.
