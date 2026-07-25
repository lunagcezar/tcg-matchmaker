# spec-070-audit-remediation-p1

## Context

P0 (`spec-069`) fixed the backend/worker layer: DB-client middleware, response/validation helpers, shared role constants, `any` removal, and the most critical bug fixes. P1 shifts the focus to the **frontend UI layer** and **shared surface completeness**. We still have duplicated list/filter markup across the home page, match list, trading list, and tournament list; create forms re-implement date/time inputs; large pages such as `SettingsPage.vue` and `tournaments/ManagePage.vue` violate the single-responsibility component rule; and several admin pages repeat fetch/loading/error/confirm logic. Shared types are also incomplete (e.g., `Event` is not exported) and there is no geocoding schema even though the worker proxies Nominatim.

This spec extracts reusable UI components, splits large pages, fills shared schemas/types, and modernizes date formatting and i18n coverage.

## Goal

- Make the frontend UI layer DRY, modular, and within size limits (pages ≤ 200 lines, organisms ≤ 250 lines).
- Complete the shared schema/type surface for all major domains and add geocoding schemas.
- Replace native `Date` formatting with Luxon and ensure all user-facing strings are i18n keys.
- Keep all existing tests green and add new component/unit tests where needed.

## Scope

### In scope

1. **Reusable UI components**
   - `BaseList` organism (home, matches, trading, tournaments, and stores lists all delegate to it for infinite scroll, empty state, and loading skeleton).
   - `EventRow` molecule (styled `router-link` wrapper used by all event lists).
   - `DateTimePicker` molecule (used by match/trading/tournament create forms).
   - `StatusBadge` atom (event/report/admin status with i18n label and color map).
   - `ConfirmDeleteDialog` molecule (reusable delete/confirmation dialog for admin lists and settings).
   - `StatusFilterSegment` molecule for the repeated `.filter-segment` on list pages.
2. **Page splitting**
   - Split `SettingsPage.vue` into `ProfileSettingsSection`, `PasswordSettingsSection`, `DangerZoneSection` organisms.
   - Split `tournaments/ManagePage.vue` into `TournamentManageHeader`, `ParticipantListSection`, `BracketMatchSection` organisms.
3. **Shared types and schemas**
   - Export `Event`, `Match`, `TradingSession`, `Store`, `Tournament`, `TournamentParticipant`, `Format`, `Tcg` from shared types.
   - Add `GeocodeQuerySchema`, `GeocodeResultSchema` to `packages/shared/src/schemas/geocoding.ts` and export from shared index.
   - Update worker geocoding route to validate query and response with the new schemas.
4. **Formatting and i18n**
   - Rewrite `useFormatDate` composable in `packages/frontend/src/composables/useFormatDate.ts` using Luxon.
   - Replace all direct `toLocaleDateString` / `new Date(...)` display formatting with `useFormatDate`.
   - Add missing en-US and pt-BR keys for admin, settings, filters, tournament bracket/best-of options, and common statuses.

### Out of scope

- Backend feature changes beyond schema adoption (no new API endpoints, no new business logic).
- Worker domain logic refactoring already covered by P0.
- E2E or visual regression tests.
- Full redesign/branding changes.

## Acceptance Criteria

### Given-When-Then

1. **List reuse**
   - Given I open `/`, `/matches`, `/trading`, `/tournaments`, and `/stores`, each page renders rows via the same `BaseList` organism and `EventRow` molecule (for event rows).
   - When I inspect the source, I no longer see duplicate `.event-row` or `.filter-segment` styles in multiple files.
   - Then the pages share filters, empty state, and loading skeleton from the component.

2. **Date/time picker reuse**
   - Given I open the create forms for matches, trading sessions, and tournaments.
   - When I interact with the date and time inputs.
   - Then all three forms use the same `DateTimePicker` component and produce identical ISO strings.

3. **Page size and responsibility**
   - Given I inspect `SettingsPage.vue` and `tournaments/ManagePage.vue`.
   - When I count their lines.
   - Then neither file exceeds 200 lines and each delegates to focused organisms.

4. **Status badge and admin tables**
   - Given I view admin tables (TCGs, reports, stores, audit log) and event cards.
   - When a row has a status value.
   - Then `StatusBadge` renders the color and i18n label consistently, and delete confirmations use `ConfirmDeleteDialog`.

5. **Shared types and geocoding schemas**
   - Given the frontend imports domain types from `@tcg/shared`.
   - When I compile the project.
   - Then `Event`, `Store`, `Tournament`, `Match`, `TradingSession`, `Format`, and `Tcg` are available, and `GeocodeQuery`/`GeocodeResult` are exported.

6. **Luxon formatting and i18n**
   - Given I view event dates, times, and notification timestamps in either locale.
   - When the locale or timezone changes.
   - Then the displayed strings update via `useFormatDate` and no raw `Date` formatting remains.

7. **Quality gates**
   - Given the full P1 branch.
   - When I run `pnpm test`, `pnpm lint`, and `pnpm -F @tcg/frontend typecheck`.
   - Then all commands exit successfully.

## Test Scenarios

1. **Unit: BaseEventList**
   - Renders rows from prop array.
   - Emits `filter-change` when status/date filters change.
   - Shows translated empty state when rows are empty.
   - Renders loading skeleton when `loading` is true.

2. **Unit: DateTimePicker**
   - Accepts separate `date` and `time` v-model strings.
   - Emits combined ISO string on change.
   - Handles invalid input gracefully.

3. **Unit: StatusBadge**
   - Maps known statuses to color and translated label.
   - Falls back to neutral color and raw value for unknown statuses.

4. **Unit: ConfirmDeleteDialog**
   - Opens with custom title/message.
   - Calls `onOk` callback and emits `confirm`.
   - Cancels emit `cancel`.

5. **Unit: useFormatDate**
   - Formats ISO string to short date in pt-BR.
   - Formats to time.
   - Returns fallback for invalid/empty input.
   - Reacts to locale changes.

6. **Integration: SettingsPage split**
   - `ProfileSettingsSection` saves profile.
   - `PasswordSettingsSection` saves password.
   - `DangerZoneSection` calls delete, suspend, and export APIs.

7. **Integration: ManagePage split**
   - `TournamentManageHeader` shows status actions.
   - `ParticipantListSection` registers/checks-in participants.
   - `BracketMatchSection` reports results and walkovers.

8. **Type check: shared exports**
   - Import every domain type from `@tcg/shared` in a smoke TypeScript file and compile.

9. **Lint/format**
   - `pnpm lint` and `pnpm -F @tcg/frontend typecheck` pass.

## Implementation Notes

- **Component extraction order**: build the atoms first (`StatusBadge`, `ConfirmDeleteDialog`), then molecules (`DateTimePicker`, `AdminStatusCell`, `StatusFilterSegment`), then organisms (`BaseEventList`, `ProfileSettingsSection`, `PasswordSettingsSection`, `DangerZoneSection`, `TournamentManageHeader`, `ParticipantListSection`, `BracketMatchSection`), then update pages to consume them.
- **Shared types**: derive from Zod schemas where they exist, and add new schemas for domains that are only typed loosely in the frontend (e.g., `EventSchema`, `MatchSchema`, `TradingSessionSchema`).
- **Geocoding**: create `GeocodeQuerySchema` (one required string) and `GeocodeResultSchema` (array of `{ display_name, lat, lon, type, importance }`). The worker route should validate the query and `z.array(GeocodeResultSchema).parse(...)` before returning.
- **Luxon**: introduce a `useFormatDate` composable that returns `formatDate`, `formatTime`, `formatDateTime`. Use `DateTime.fromISO(...).setLocale(locale).setZone(timezone)`.
- **i18n**: add keys under `common.status.*`, `admin.columns.*`, `settings.fields.*`, `filter.*`.
- **Size enforcement**: keep all page components ≤ 200 lines and all organisms ≤ 250 lines; if a section still exceeds it, split again.
- **Testing**: use Vitest + Vue Test Utils. Mock `api*` calls in component tests via `vi.hoisted`/`vi.mock` pattern already used in the project.

## Risks

- Large file moves may break existing component paths or tests; rely on TypeScript and tests to catch.
- i18n key additions require updating both en-US and pt-BR; missing keys will surface in lint or tests.
- Shared schema additions may conflict with frontend local types; resolve by deleting duplicated local types.

## Related Documents

- `spec/spec-069-audit-remediation-p0.md` — predecessor.
- `AGENTS.md` — monorepo conventions and component rules.
- `docs/pages.md` — route/component map.
- `docs/data-model.md` — domain entities.
