# Changelog

All notable changes to this project will be documented in this file.

## [0.68.1] — 2026-07-24

### Changed

- `AGENTS.md`: added a new "Frontend DRY & Quality Guidelines" section documenting the P1 audit rules: page size ceiling (≤ 200 lines), `BaseList` + `EventRow` reuse, `StatusFilterSegment`/`StatusBadge`/`ConfirmDeleteDialog`/`DateTimePicker` primitives, `useFormatDate` for all dates, i18n completeness, layout provide/inject pattern for shared refs, SSR/test-safe `localStorage`/`navigator` guards, and shared Zod schemas from `@tcg/shared`.
- `AGENTS.md`: added a new "Worker DRY & Quality Guidelines" section documenting the P0 audit rules: DB client created once per request via `dbClientMiddleware`/`c.var.db`, `validate()` helper for all Zod parsing, response helpers for all envelopes, shared `ROLES`/`STORE_MEMBERSHIP_ROLES` constants, no `any` in production, no raw `fetch()` in the frontend, and regression tests for every bug fix.
- `docs/pages.md`: updated the component organization diagram with the new atoms/molecules/organisms and added sections for page size/splitting, reusable list pattern, and reusable form/display molecules.
- `docs/worker-architecture.md`: updated router layer examples to use `dbClientMiddleware` + `c.var.db` and response helpers (`ok`, `notFound`, etc.), updated the cross-cutting concerns table with DB client, response/validation helpers, and shared schemas, and added a "Quality Guidelines" section covering the P0 rules.
- `docs/client-api-architecture.md`: replaced the deprecated `lib/format.ts` entry with `useFormatDate`, added a date-formatting section, and added an "API Client Quality (P0)" section requiring the use of `apiGet`/`apiPost`/`apiPatch`/`apiDelete` wrappers and forbidding raw `fetch()` / Hono RPC.
- `docs/requirements.md`: expanded the Code Quality NFRs with P1 frontend rules (NFR-28a–h) and added a new "Backend DRY / Worker Quality (P0)" subsection (NFR-29–34) for DB client reuse, validation helpers, response helpers, shared constants, no `any`, and regression tests.

## [0.68.0] — 2026-07-24

### Added

- Spec: `spec/spec-070-audit-remediation-p1.md` and `spec/plan-spec-070-audit-remediation-p1.md`.
- Reusable list component: `packages/frontend/src/components/organisms/BaseList.vue` (generic, infinite-scroll wrapper with empty state and loading skeleton; used by event list pages and the store list page).
- Reusable event row component: `packages/frontend/src/components/molecules/EventRow.vue` (styled `router-link` wrapper).
- Injection key for `MapListLayout` scroll target: `packages/frontend/src/lib/injectionKeys.ts` so `BaseList` can inject the scroll target without page-level refs.
- Settings organisms: `ProfileSettingsSection`, `PasswordSettingsSection`, `DangerZoneSection` under `src/components/organisms/settings/`.
- Tournament management organisms: `TournamentManageHeader`, `ParticipantListSection`, `BracketMatchSection` under `src/components/organisms/tournament/`.
- i18n keys: `common.status.*` for all event/user statuses, `admin.columns.*`, `admin.deleteConfirm`, `admin.banConfirm`, `admin.unbanConfirm`, `admin.promoteConfirm`, `settings.fields.*`, `filter.*`, `event.defaultParticipantHint`, `tournament.name`, `tournament.bracketType`, `tournament.bestOf`, `tournament.bracketOptions.*`, `tournament.bestOfOptions.*`.
- `fallbackLocale: 'en-US'` in `boot/i18n.ts` so partial locale fallback resolves to the available translation set.

### Changed

- `IndexPage`, `matches/ListPage`, `trading/ListPage`, `tournaments/ListPage`, and `stores/ListPage` now all delegate infinite scroll, empty state, and loading skeleton to `BaseList`; event rows use `EventRow` and `StatusFilterSegment` replaces duplicated custom segmented controls.
- `SettingsPage.vue` is now under 200 lines and delegates the three tab panels to the new settings organisms; it uses `AppCard` for the panel shell and the `ConfirmDeleteDialog` molecule for delete/suspend confirmations.
- `tournaments/ManagePage.vue` is now under 200 lines and delegates rendering to the new tournament organisms; it uses `StatusBadge` for tournament status.
- Admin list pages (`TcgListPage`, `UserListPage`, `StoreManageListPage`, `ReportListPage`, `AuditLogPage`, `FormatListPage`) now use i18n column labels and `StatusBadge` for status cells; `TcgListPage` and `UserListPage` use `ConfirmDeleteDialog` for destructive/modifying actions.
- `matches/CreatePage`, `trading/CreatePage`, and `tournaments/CreatePage` now use the shared `DateTimePicker` molecule for date/time input, removing duplicated QDate/QTime popup wiring.
- `StatusBadge` color map extended to cover `in_progress`, `planned`, `challenged`, `draft`, `checked_in`, `declined`, and `walkover`.
- `useAppStore` and `lib/i18n.ts` now guard access to `localStorage` and `navigator` so they do not throw in SSR/test environments.

### Fixed

- `useFormatDate` test no longer fails because `localStorage` is undefined in the test environment.
- `ConfirmDeleteDialog` and `StatusFilterSegment` component tests now correctly stub named Quasar components.
- `TcgListPage` and `UserListPage` no longer inline `$q.dialog` confirmation wiring; all confirmations flow through `ConfirmDeleteDialog`.

## [0.67.0] — 2026-07-24

### Added

- Spec: `spec/spec-069-audit-remediation-p0.md` and `spec/plan-spec-069-audit-remediation-p0.md`.
- Shared constants: `STORE_MEMBERSHIP_ROLES` and `StoreMembershipRole` in `packages/shared/src/constants.ts`.
- Worker helpers: `src/lib/responses.ts` and `src/lib/validation.ts` for standard `{ data, error, meta }` responses and Zod validation.
- Worker middleware: `src/middleware/db.ts` attaches the secret Supabase client to `c.var.db` once per request.
- Frontend helper: `src/lib/i18n.ts` exports `detectLocale()` so the locale decision is testable outside the Quasar boot file.
- Regression tests: `src/lib/__tests__/validation.test.ts`, `src/boot/__tests__/i18n.test.ts`, `src/constants/__tests__/tournament.test.ts`, and an expanded `tournaments/__tests__/index.test.ts` bracket round test.

### Changed

- Worker: all domain routers now read `c.var.db` instead of constructing `createSecretClient(...)` in every route handler.
- Worker: all domain services now use the shared `validate()` helper from `src/lib/validation.js` instead of hand-formatting Zod error messages.
- Worker: all response envelopes are built through helpers in `src/lib/responses.js`.
- Worker: `authMiddleware`, `adminMiddleware`, `auth/repository.ts`, `moderation/repository.ts`, and `stores/repository.ts` now use the shared `ROLES`/`STORE_MEMBERSHIP_ROLES` constants instead of string literals.
- Frontend: `boot/i18n.ts` now uses `detectLocale()` from `src/lib/i18n.ts`.
- Frontend: `BEST_OF_OPTIONS` in `src/constants/tournament.ts` now uses numeric values, matching the `CreateEventSchema` `best_of` type.
- Frontend: `useAuthStore.fetchProfile()` now uses the shared `apiGet()` wrapper instead of raw `fetch`.
- Frontend: `useAdminStore.ts`, `useAccountManagement.ts`, `ProfilePage.vue`, `router/index.ts`, `useNavTree.ts`, and `lib/colors.ts` use the shared `Role`/`ROLES`/`STORE_MEMBERSHIP_ROLES` types and constants.
- Shared: `types/index.ts` re-exports `Role` and `StoreMembershipRole` from `constants.ts`.
- Shared: `StoreMembershipSchema.role` now derives its enum from `STORE_MEMBERSHIP_ROLES`.
- Tests: worker route tests use `createTestApp()` from `test-utils/supabase.ts`, which wires `dbClientMiddleware` automatically.

### Fixed

- Locale precedence bug: `localStorage.locale = 'en-US'` is now respected instead of always defaulting to Portuguese.
- Bracket endpoint bug: `GET /api/tournaments/:id/bracket` now returns matches for every round, not just the first round.
- Tournament creation bug: `best_of` is now sent as a number, satisfying the Zod schema.
- Removed explicit `any` usage from `useAdminStore.ts` and `useAccountManagement.ts`.
- Removed pre-existing unused `vi` import warning in `FilterToggle.test.ts`.

## [0.66.0] — 2026-07-23

### Added

- Spec: `spec/spec-065-worker-domain-refactor.md`.
- Worker domain refactoring: every domain folder (`auth/`, `events/`, `moderation/`, `notifications/`, `stores/`, `tcgs/`, `tournaments/`) now follows a three-layer structure:
  - `router.ts` — thin Hono route definitions
  - `service.ts` — business logic and validation orchestration
  - `repository.ts` — pure Supabase query functions
  - `index.ts` — re-exports from `router.ts` (imports unchanged)
- `tournaments/bracket-generators.ts`: added `generateSingleElimination` with the same `(supabase, tournamentId, playerIds)` signature as the other 4 generators.
- Worker architecture docs: `docs/worker-architecture.md` — documents the Router → Service → Repository pattern, layer rules, and conventions.
- Seed data: `supabase/seed.sql` — 5 users, 4 TCGs with formats, 3 Fortaleza stores, 60 events (20 matches, 20 trading, 20 tournaments), bracket rounds and matches for 2 in_progress tournaments, participants, notifications, a report, and audit log. All events are future-dated or in_progress. Tournaments span all 5 bracket types. Two in_progress tournaments have pre-generated brackets (single_elimination + double_elimination) with checked-in players for immediate bracket visualization.
- Dev setup docs: `docs/dev-setup.md` — includes quick start, seed documentation, troubleshooting guide.
- Dev setup script: `scripts/setup-dev.sh` — runs `supabase db reset --local`, waits for Auth API, creates auth users with matching UUIDs via admin API.
- `MapListLayout` component: reusable full-viewport layout with optional map (40vh), sticky filter bar, and scrollable list area.
- Spec: `spec/plan.md` with technical decisions and refactoring order.
- Spec: `spec/spec-066-map-list-layout.md`.
- Spec: `spec/spec-067-leaflet-map-fixes.md`.
- Spec: `spec/spec-068-filter-segment-admin-table.md`.

### Changed

- Worker domain files reduced from monolithic 120–506 lines to 1-line re-exports (all logic split into router/service/repository).
- `IndexPage`, `matches/ListPage`, `trading/ListPage`, `tournaments/ListPage`, `stores/ListPage` all use `MapListLayout` with viewport-filling layout (map + sticky filters + scrollable list).
- `EventMap` now switches to CartoDB dark tiles when Quasar dark mode is active.
- Shared schemas: all `z.string().datetime()` replaced with `z.string()` across event, store, notification, tcg, report, and tournament schemas (Supabase timestamp format incompatible with Zod's strict datetime validator).
- `supabase/seed.sql`: removed `auth.users`/`auth.identities` inserts (auth schema doesn't exist at seed time — handled by setup script instead).
- README: updated quick start and seed docs with `bash scripts/setup-dev.sh` step and instructions.

### Fixed

- `GET /api/events/:id` returning 500 with `ZodError` — timestamp fields now use `z.string()` instead of `z.string().datetime()`.
- Login failing for seed accounts — auth users now created via Auth Admin API with custom `id` parameter after auth container starts.
- All `createSecretClient` imports use `import type` for `@typescript-eslint/consistent-type-imports` compliance.
- Router files use non-null assertions (`c.req.param('id')!`) for Hono 4's `string | undefined` param types.
- Removed unused `setupOrgGuard` dead function from tournament test (pre-existing tsc error).
- Added schema validation tests (`src/__tests__/schemas.test.ts`) — 12 tests covering all domain schemas with Supabase-style timestamp format, preventing timestamp format regressions.
- `IndexPage.vue`: home page filter now re-fetches from server when the filter tab changes; `loadMore` passes the active type filter so infinite scroll loads more of the selected type instead of all events.
- `EventFeed.vue`: added status badge next to the type badge on each event row.
- Maps now respect filter tabs and search — only filtered events/stores appear on the map.
- `vue-tsc` type errors: `scroll-target` prop type narrowed, `null` filtered via computed.
- `EventMap` height no longer hardcoded — controlled by parent layout (flex).
- Leaflet map fixes: zoom control z-index lowered to 400 (below navbar), attribution control removed, `fitBounds` animation disabled (`{ animate: false }`).
- Filter controls replaced with segmented-control pattern: native `<button>` elements with shared outer border, inner dividers, ghost/transparent background, active state shows bold primary text. Wraps on small screens.
- Home page filter tabs: added "All" option, exclusive selection (clicking a type deselects "All" and vice versa), i18n support for labels.
- Matches list page status filter uses the same segmented-control pattern (was `FilterToggle` / `q-btn-toggle`).
- AdminTable: transparent `card-style` background so it inherits the page background. All cells left-aligned by default, `.q-td--actions` right-aligned. Header and body backgrounds transparent.
- NotificationBell: added `dense` prop to `q-btn-dropdown` for consistent padding with other nav buttons.
- Leaflet map: added `leaflet.markercluster` for clustering nearby markers. Map container background set to `var(--background)` to prevent white flash before tiles load in dark mode. On mount, skips intermediate `setView` when events are already available.

## [0.65.0] — 2026-07-16

### Added

- Worker: cursor-based pagination for `GET /api/stores` — supports `limit` and `cursor` query params, returns `meta.next_cursor`, `meta.has_more`.
- Worker: `GET /api/auth/resolve/:identifier` — returns the email for a given email or username, enabling login-by-username.
- Worker geocoding: added `addressdetails=1` to Nominatim search URL — structured address (city, state, country) now returned in results.
- Frontend: `GeocodeAddress` interface (city, state, country) in `useGeocode` composable.
- Frontend location autocomplete: emits `city`, `state`, `country` alongside lat/lng on selection.
- Frontend: "Remember me" checkbox on login page — when unchecked, `restoreSession` signs out on page reload (session does not persist).
- Frontend: Login accepts email or username — single "Email or Username" field; resolves to email via Worker before signing in.
- Frontend: Store list now uses `q-infinite-scroll` with cursor-based pagination (20 items per page).

### Changed

- `StoreCreatePage`: replaced lat/lng/city/state inputs with `LocationAutocomplete` — fills all location fields from geocoding selection.
- `useAuthStore.signIn`: accepts optional `rememberMe` boolean (default `true`); stores flag in localStorage.
- `useAuthStore.restoreSession`: checks `tcg_remember_me` flag — signs out and clears session when flag is `false`.
- `useStoreStore`: added `loadMore`, `hasMore`, `nextCursor` for infinite scroll pagination; `list` resets pagination state.
- AuthForm: supports new `identifier` field type (accepts email or username, no email format validation).
- LoginPage: uses `identifier` + `password` fields; calls `resolveIdentifier` before `signIn`.
- i18n: added `auth.emailOrUsername`, `auth.rememberMe`, `store.searchLocation`.

### Fixed

- Worker stores pagination: replaced `Buffer` (unavailable in Workers) with `btoa`/`atob` base64url helpers.
- Tests: updated LoginPage test mocks to include `resolveIdentifier` and new `handleLogin` signature.
- Tests: fixed store GET mock — chained `.order().order().limit()` now resolves at `limit` instead of `order`.

## [0.64.0] — 2026-07-16

### Added

- Spec: `spec/spec-063-tree-date-feedback.md`.
- Worker: `GET /api/admin/users` — list all non-deleted users (id, username, email, role, banned_at, created_at) for the admin UserListPage.
- Worker: `DELETE /api/admin/users/:id` — soft-delete a user with audit logging.
- Frontend: `useGeocode` composable — debounced Nominatim search via Worker proxy.
- Frontend: `LocationAutocomplete` molecule component — QSelect with use-input, filterable geocoding, emits lat/lng/displayName on selection.
- Frontend: `TcgCreatePage` at `/admin/tcgs/create` — standalone page using AppCard for creating TCGs, replacing the inline dialog.
- Frontend: `AdminPageHeader` `action-to` prop — action button becomes a router link when set.

### Changed

- All three create forms (matches, trading, tournaments): replaced raw lat/lng inputs with `LocationAutocomplete` — fills lat/lng from Nominatim result, stores address as `custom_location_name`.
- Admin `UserListPage`: fetches all users via `GET /api/admin/users` instead of just the current user; added confirmation dialogs for ban/unban/promote.
- Admin `TcgListPage`: "New TCG" button links to `/admin/tcgs/create` instead of opening a dialog; added confirmation dialog for delete.
- `SiteBranch`: removed chevron expansion icon — parent items with children render as flat links with indented sub-items only.
- `QDate+QTime` popups in create forms: wrapped in `<div class="row items-start no-wrap">` so date and time pickers sit side-by-side.

### Fixed

- CSS specificity for admin nav children: `.app-nav-children` selectors prefixed with `.app-sidebar__scroll` / `.app-mobile-drawer` to properly override the global `ul` reset.

## [0.63.0] — 2026-07-16

### Fixed

- SettingsPage profile save: shows API error message inline below the save button (same pattern as password tab); updates `authStore.profile` optimistically on success.
- Date fields in create forms: replaced native `datetime-local` with Quasar QDate+QTime popups; `scheduled_at` is converted to ISO string before submission.

## [0.62.0] — 2026-07-16

### Added

- Spec: `spec/spec-062-ux-fixes-tooling.md`.
- Worker: username uniqueness validation on PATCH /profile (returns 409 if taken).
- Worker test: duplicate username rejection (71 total worker tests).

### Fixed

- quasar.config.ts: registered `auth` boot file so session restore runs before route guards on page refresh.
- quasar.config.ts: added `Dialog` Quasar plugin — `$q.dialog()` now works in SettingsPage account operations.
- ProfilePage.vue vue-tsc error: passes `:item="profile"` to AppDetailLayout instead of invalid `:title` and `:empty` props.
- Worker auth middleware: uses secret key for DB queries instead of publishable key — fixes 401 on all auth operations after DB reset (RLS on `users` table has no policies, so publishable key queries are blocked).
- useAuthStore.restoreSession: clears user and signs out when fetchProfile returns null (stale session after DB reset).
- SettingsPage: username input is now editable (removed `readonly`).
- useApi.ts: all API calls (`apiGet`/`apiPost`/`apiPatch`/`apiDelete`) now include the Supabase access token in `Authorization` header — fixes 401 on all protected routes (notifications, profile update, account management).
- Refactored Supabase client into shared singleton at `src/lib/supabase.ts` — eliminates redundant client creation in `useAuthStore.ts` and `boot/supabase.ts`.

## [0.61.0] — 2026-07-16

### Added

- Spec: `spec/spec-061-ux-fixes-regressions.md`.
- Database migration: `20260714000004_remove_display_name.sql` — drops redundant `display_name` column from `users`.
- `packages/frontend/src/boot/auth.ts`: boot file that restores Supabase session before route guards run (fixes refresh redirect to login).
- `AppCard.test.ts`: tests for title rendering, error/success QChip, notification position.
- `UserMenu.test.ts`: tests for unauthenticated (login/signup), authenticated with username, fallback to email prefix, avatar initial.

### Changed

- Shared schemas (`packages/shared/src/schemas/user.ts`): removed `display_name` from `SignupSchema`, `UserSchema`, `UserResponseSchema`; `ProfileUpdateSchema` now accepts `username` instead.
- Worker `PATCH /auth/profile` and `POST /auth/onboarding`: removed `display_name` references.
- `AppCard.vue`: replaced `<p>` error/success messages with `<q-chip>` (Quasar Chip component) using `error`/`check_circle` icons, positioned between header and body via `.app-panel__notifications`.
- `UserMenu.vue`: prefers `authStore.profile?.username` over `authStore.user?.email?.split('@')[0]` or `'User'`.
- `SettingsPage.vue`: implemented three QTabs (Profile, Password, Account) with username display, password change, and account management (data export, suspend, delete).
- `SignupPage.vue`: removed `displayName` field; shows `$q.notify` success toast before redirecting to login.
- `OnboardingPage.vue`, `AuthForm.vue`, `ProfilePage.vue`: removed `display_name` fields and references.
- `useAuthStore.ts`: added `updatePassword()` method; removed `display_name` from `UserProfile` type.
- i18n (`en-US`/`pt-BR`): added `settings.tabProfile`, `settings.tabPassword`, `settings.tabAccount`, `auth.currentPassword`, `auth.newPassword`; removed `auth.displayName`.
- Boot `i18n.ts`: reads locale from `localStorage` before falling back to `navigator.language` (fixes locale loss on F5).
- `docs/data-model.md`: removed `display_name` from the users table schema.
- Updated tests for schema changes (SettingsPage, SignupPage, OnboardingPage, ProfilePage, useAccountManagement).
- 182 tests pass (70 worker + 112 frontend).

## [0.60.0] — 2026-07-16

## [0.60.0] — 2026-07-16

### Added

- Visual refactor spec: `spec/spec-060-visual-refactor.md`.
- New font dependencies: `@fontsource-variable/bitter` and `@fontsource-variable/cascadia-code`.
- Global CSS theme aligned with `artemisluna.com.br`:
  - CSS custom properties for background, foreground, primary, muted, border, radius.
  - Light and dark mode tokens reacting to Quasar's `body--dark` class.
  - Rounded borders for images, maps, avatars, cards, and panels.
- `useNavTree` composable: builds a filtered navigation tree with admin branch conditional on the user's profile role.
- `SiteBranch` recursive navigation component: renders a link and expands child links when the current route is inside its subtree.
- Sidebar footer with copyright notice linking to Luna G. Cezar and `artemisluna.com.br`.
- Tests:
  - Updated `MainLayout.test.ts` for new navbar/sidebar/drawer structure.
  - Added `SiteBranch.test.ts` for recursive expansion behavior.
  - Added `useNavTree.test.ts` for admin branch filtering and active-route helpers.
  - Updated `IndexPage.test.ts` to assert map is rendered above the feed.

### Changed

- `MainLayout`: replaced Quasar header/drawer with a fixed centered navbar, collapsible mobile drawer, and sticky desktop sidebar reusing the same navigation tree.
- `AdminLayout`: admin routes now use `MainLayout`; the admin branch expands automatically when navigating inside `/admin/*`.
- `IndexPage`: switched from side-by-side map/feed to a vertical stack with the map on top and filters + event feed below.
- `EventFeed`: replaced card rows with bordered list rows.
- `EventMap`: added rounded container styling and primary-colored markers.
- `AppCard`, `AppListLayout`, `AppDetailLayout`: removed heavy card shadows in favor of bordered panels with rounded corners and open layout spacing.
- `AdminDashboardPage`: replaced card grid with bordered link tiles.
- `AdminTable`: removed outer borders, kept flat table styling.
- `AdminPageHeader`: kept as a plain header without card wrapper.
- `ThemeLangSwitcher`: compact locale code display (`EN`/`PT`) and dense controls.
- `UserMenu`: uses display name from `useAuthStore.profile`; avatar size reduced.
- `useAuthStore`: added `profile` ref and `fetchProfile()` method to load role/display name from `GET /api/auth/me`.
- i18n: added `nav.admin`, `nav.home`, and `sidebar.copyright` keys in `en-US` and `pt-BR`.
- `navItems.ts`: added `NavNode` interface and `navTree` export with admin children.
- `routes.ts`: `/admin/*` routes now render inside `MainLayout.vue`.
- Added `FilterToggle` molecule component: styled `q-btn-toggle` with primary text, primary outline, and bold active state.
- Replaced `q-btn-toggle` in `FilterBar` and `matches/ListPage` with `FilterToggle`.
- Fixed layout overflow: set `.q-layout` width to `100%` and `.app-shell` `align-items: flex-start` to avoid unnecessary vertical scrollbars.
- Hidden desktop sidebar on mobile (`<1024px`) and added left border for visual separation.
- Dark-mode form polish: primary focus/label color on outlined inputs and lighter error red.
- Added `FilterToggle.test.ts` and updated `FilterBar.test.ts` / `MatchListPage.test.ts` stubs.
- Added `QInfiniteScroll` to `EventFeed` for paginated home feed.
- Added cursor-based pagination to `GET /api/events` with `limit` and `cursor` query params.
- Extended `useEventStore` with `loadMore`, `hasMore`, `loadingMore`, and `nextCursor` for infinite scroll.
- Added `EventFeed.test.ts` and updated `useEventStore.test.ts` / worker events tests for pagination.
- Updated `eslint.config.mjs` to ignore `.wrangler/**` generated files.

## [0.59.0] — 2026-07-15

### Added

- `AppListLayout` and `AppDetailLayout` layout components in `src/layouts/`:
  - `AppListLayout`: reusable list page shell with title header, actions/filters slots, loading spinner, and empty state.
  - `AppDetailLayout`: reusable detail page shell with centered responsive container, loading spinner, and optional empty state.
- Responsive behavior to `AppCard`, `AppListLayout`, and `AppDetailLayout`:
  - `AppCard`: `width` prop is now treated as `max-width`; card uses `width: 100%` so it fills small screens and caps on larger screens.
  - `AppDetailLayout`: `width` prop is now treated as `max-width`; container uses `width: 100%`.
  - `AppListLayout`: page header stacks vertically on mobile and sits side-by-side on larger screens.

### Changed

- AppCard: moved from `atoms/` to `molecules/` — now wraps `<q-page>` with configurable `pageClass`, accepts `bodyClass` for inner section styling, and supports `error`/`success` banner props (merged from AuthCard).
- AuthCard: removed — functionality absorbed into AppCard.
- Auth pages (Login, Signup, Onboarding): use `AppCard` directly with `page-class="row items-center justify-center"`.
- Refactored form pages to use `AppCard`:
  - `SettingsPage`, `matches/CreatePage`, `trading/CreatePage`, `tournaments/CreatePage`, `stores/CreatePage`, `stores/SettingsPage`.
- Refactored list pages to use `AppListLayout`:
  - `matches/ListPage`, `trading/ListPage`, `tournaments/ListPage`, `stores/ListPage`, `notifications/NotificationPage`.
- Refactored detail pages to use `AppDetailLayout`:
  - `matches/DetailPage`, `trading/DetailPage`, `tournaments/DetailPage`, `tournaments/ManagePage`, `stores/DetailPage`, `ProfilePage`.
- `AppCard`: added `titleClass` prop for customizable title alignment (defaults keep centered auth-page behavior).
- SettingsPage: converted to use `AppCard` with `body-class="q-gutter-sm"`.

### Fixed

- TypeScript errors in `AppDetailLayout` (`withDefaults` + `exactOptionalPropertyTypes` conflict) by making `item` a required prop.
- Vue template nullability errors in detail pages (`ProfilePage`, `matches/DetailPage`, `trading/DetailPage`, `tournaments/DetailPage`, `tournaments/ManagePage`, `stores/DetailPage`) with non-null assertions inside `AppDetailLayout` slots.

## [0.58.0] — 2026-07-15

### Added

- AuthFooter molecule component: reusable footer with message + link button for auth pages (replaces duplicated template code).
- AuthForm: centered submit button via flexbox instead of full-width.

### Fixed

- AppCard: `q-card-actions` now uses `align="center"` for centered action buttons.

## [0.57.0] — 2026-07-15

### Added

- LoginPage: loading spinner on submit button, inline error/success messages, error handling via try/catch.
- SignupPage: inline error messages, proper try/catch/finally (was silently swallowing errors).
- OnboardingPage: inline success message with delayed redirect after admin creation.
- Tests: 7 new tests (LoginPage error/clear, SignupPage error/clear, OnboardingPage render/error/success) — 86 total frontend tests.

### Fixed

- Login form now shows user-visible feedback on failure instead of silently failing.
- Signup form now catches and displays errors instead of silently swallowing them.
- Onboarding form now shows a success message before redirecting to login.

## [0.56.0] — 2026-07-15

### Added

- `orgGuardByMatch()` helper: verifies the requesting user is the tournament creator by walking `bracket_matches → bracket_rounds → events`.
- Tests: onboarding POST (201 success, 400 duplicate) and bracket match auth guard (403 non-organizer, 200 organizer) — 5 new worker tests (69 total).

### Fixed

- `POST /api/bracket-matches/:id/report` and `POST /api/bracket-matches/:id/walkover` now check tournament ownership — returns 403 if the caller is not the organizer.
- TypeScript strict null check: `c.req.param('id')` result guarded before passing to `orgGuardByMatch()`.

## [0.55.0] — 2026-07-15

### Added

- Database migration `20260714000003_grant_service_role.sql`: grants all table-level privileges to `service_role` so the Hono Worker secret key can INSERT/SELECT/UPDATE/DELETE.
- README: documented `supabase db push --local` and `supabase db reset --local`.

### Changed

- AuthForm: confirm password field now only shows when `confirmPassword` is explicitly listed in the `fields` prop — login form unaffected.
- Signup and onboarding pages: added `'confirmPassword'` to their field lists.
- `UserSchema` / `UserResponseSchema`: replaced `z.string().datetime()` with `z.string()` for all timestamp fields to avoid ZodError from Supabase date formats.
- Rate-limit middleware: skips rate limiting when `SUPABASE_URL` contains `localhost` or `127.0.0.1` (local dev detection).
- Updated spec-035 to reflect current nav items structure.

### Fixed

- `POST /api/auth/onboarding` error response now includes the database error message for debugging.
- `POST /api/auth/onboarding` no longer throws a 500 ZodError when parsing the created user record.

## [0.54.0] — 2026-07-15

### Fixed

- Frontend regressions (spec-053):
  - Onboarding redirect now triggers when no admin exists — cached API check avoids repeated calls
  - Removed redundant sidebar drawer from MainLayout
  - Added Stores link to navbar; removed duplicate Home link (app title already links to `/`)
  - Navbar links now bold when the current route matches via `isActiveRoute()`
  - Dark mode toggle now actually applies to the UI via Quasar `Dark` plugin + `$q.dark.set()`
- Tests: 10 new tests for navItems, useAuthStore onboarding caching, and MainLayout (79 total passing)

## [0.53.0] — 2026-07-15

### Added

- Sentry integration:
  - Worker: `@sentry/hono/cloudflare` middleware for request isolation + `@sentry/cloudflare` peer dependency.
  - Worker: `createSentryTransport()` adapter wires the existing `createLogger` to real Sentry `captureException`/`captureMessage`.
  - Worker: `SENTRY_DSN` from Cloudflare bindings drives initialization; empty DSN safely disables Sentry.
  - Worker: automatic error capture stays in the existing `app.onError` handler to preserve LGPD sanitization.
  - Frontend: `@sentry/vue` boot file initialized from `VITE_SENTRY_DSN` with browser tracing and session replay.
  - Frontend: `sentry` added to Quasar boot sequence.

### Fixed

- Worker Wrangler build:
  - Upgraded `wrangler` to v4 (`4.110.0`).
  - Removed invalid top-level `routing` field from `packages/worker/wrangler.jsonc`.
  - Replaced empty KV namespace IDs with descriptive placeholders so `wrangler deploy --dry-run` validates.
  - Documented how to create real KV namespaces via `wrangler kv namespace create --update-config` or the dashboard.

## [0.52.0] — 2026-07-15

### Added

- Full page test coverage — all 31 pages now have at least one render test:
  - MatchCreate, TradingCreate, TournamentCreate, StoreCreate: render (4 tests)
  - TournamentManage: render (1 test)
  - ErrorNotFound, SecondPage: render (2 tests)
  - Total: 34 page tests across 31/31 pages
  - 133 total tests (64 worker + 69 frontend)

## [0.51.0] — 2026-07-15

## [0.50.0] — 2026-07-15

## [0.49.0] — 2026-07-15

### Added

- Domain types from `@tcg/shared` Zod schemas:
  - `src/types/domain.ts` re-exporting `Event`, `Store`, `Notification`, `UserResponse`, `StoreMembership`, etc.
  - Stores now use proper types: `Event[]` instead of `Record<string, unknown>[]`
  - Removed dozens of `as Record<string, string>` casts across all pages
  - Fixed 6 post-migration type errors (implicit any, filter signatures)

## [0.48.0] — 2026-07-15

### Added

- Client refactoring (spec-048):
  - Replaced Hono RPC (`hc<AppType>()`) with typed fetch wrapper (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`)
  - Removed 5 dead composables (`useEvent`, `useStore`, `useTournament`, `useTcg`, `useGeolocation`)
  - Migrated `useNotifications` to Pinia store (`useNotificationStore`)
  - Added `update()` and `getMembers()` to `useStoreStore`
  - Fixed all frontend TypeScript errors (55+ `vue-tsc` errors resolved)

## [0.47.0] — 2026-07-15

### Added

- Shared utilities extracted to `src/lib/` (spec-047):
  - `lib/api.ts` — `getApiBase()` (single source for API URL)
  - `lib/format.ts` — `formatDate()`, `relativeTime()` (replaced 7+ inline definitions)
  - `lib/colors.ts` — centralized color mapping functions (replaced 6+ inline definitions)
  - `lib/router.ts` — `eventRoute()` helper
  - All 28 `apiUrl` redeclarations replaced with lib imports
- Migrated all API calls to Hono RPC client via `getClient()` (later superseded by spec-048)

## [0.46.0] — 2026-07-15

### Added

- Root ESLint v9 flat config with Prettier support (spec-046):
  - `eslint.config.mjs` at workspace root, shared by `frontend`, `worker`, and `shared`
  - `typescript-eslint` for TypeScript rules
  - `eslint-plugin-prettier` reports formatting issues as ESLint errors
  - `--cache` enabled on all ESLint commands for fast incremental runs
  - Per-package `eslint.config.js` files for `packages/worker` and `packages/shared`
  - `lint:fix` and `format:check` root scripts; `pnpm lint` now checks formatting across the whole workspace
  - `.prettierignore` to skip agent skill files and `pnpm-lock.yaml`

### Changed

- Refactored `packages/frontend/eslint.config.js` to extend the root base and add Quasar + Vue rules locally
- Kept Vue-specific ESLint dependencies (`eslint-plugin-vue`, `vue-eslint-parser`) in the frontend package only to avoid duplicate plugin-instance warnings
- Removed duplicate `packages/frontend/.prettierrc.json`; root `.prettierrc` is now the single source of truth
- Updated `lint-staged` to run ESLint + Prettier consistently for all staged source files
- Fixed inline `as Record<...>` type assertions in Vue templates that Prettier could not parse
- Fixed type issues in `StoreManageDetailPage.vue` so `vue-tsc --noEmit` passes

## [0.45.0] — 2026-07-15

### Added

- PWA setup (spec-045):
  - Service worker registration via native `navigator.serviceWorker.register()`
  - Web app manifest (theme_color #1976d2, standalone display)
  - `src-pwa/` directory with register-sw.ts, manifest.json
  - Icon generation documented as TODO in `src-pwa/README.md`

## [0.44.0] — 2026-07-15

### Added

- SEO crawler worker (spec-044):
  - Cloudflare Pages Function (`functions/_middleware.ts`) detecting crawler user-agents
  - Dynamic HTML shell rendering for `/matches/:id`, `/trading/:id`, `/tournaments/:id`, `/stores/:id`, `/profile/:username`
  - OpenGraph, Twitter Card, and JSON-LD structured data for crawlers
  - `/robots.txt` served from edge with allow/disallow rules
  - `/sitemap.xml` served from edge with static + dynamic entries
  - Switched frontend router from hash to history mode
  - `_redirects` file for SPA fallback on Cloudflare Pages
  - 15 tests for crawler detection, URL matching, HTML shell, JSON-LD
- SEO hybrid strategy documentation (`docs/seo-hybrid-strategy.md`)

## [0.43.0] — 2026-07-15

### Added

- Confirmation flow (spec-043):
  - Match detail page — confirm/decline buttons after joining, status-based UI
  - Trading detail page — full RSVP → confirm/decline flow
  - Backend: join route now accepts trading sessions (was match-only)
  - `useEventStore.decline()` method
  - i18n strings for decline action (en-US + pt-BR)

## [0.42.0] — 2026-07-15

### Added

- Admin store detail page (spec-042):
  - Store info display + edit form (name, description, address, phone, website)
  - Verify button (POST /api/stores/:id/verify)
  - Suspend with reason prompt dialog (POST /api/stores/:id/suspend)
  - Soft-delete with confirmation dialog (DELETE /api/stores/:id)
  - Members list display
  - `useAdminStore` composable with tests

## [0.41.0] — 2026-07-15

### Added

- Account management settings (spec-041):
  - Account deletion with last-admin protection and confirmation dialog
  - Account suspension with confirmation dialog (temporary block)
  - LGPD data export as JSON download
  - `useAccountManagement` composable with deleteAccount, suspendAccount, exportData
  - i18n strings (en-US + pt-BR)
  - Quasar dialog confirmation + notify feedback for all destructive actions

## [0.40.0] — 2026-07-15

### Added

- Notifications UI (spec-040):
  - `useNotifications` composable with list, unread count, mark read, mark all read, Realtime subscription
  - `NotificationBell` component with unread badge in navbar
  - `NotificationList` dropdown panel (5 most recent notifications, deep-link, relative timestamps)
  - Notification page at `/notifications` with full list, mark-read buttons, "Mark all as read"
  - Realtime subscription for live notification updates
  - Push notification opt-in toggle on settings page
  - i18n strings (en-US + pt-BR)
  - Route, nav item, UserMenu link for notifications

### Fixed

- Router.push calls now properly voided for lint compliance

## [0.39.0] — 2026-07-14

### Added

- BO3/BO5 support: `best_of` field on tournaments (BO1/BO3/BO5 selector)
- Shared schema: `ReportMatchSchema` with score validation
- Migration: `best_of` column added to events table
- Worker: report endpoint validates scores with ReportMatchSchema
- CreatePage: Best Of selector (BO1/BO3/BO5)
- ManagePage: score inputs for P1/P2 with auto-winner detection
- D3 bracket: score1/score2 fields populated from API

## [0.38.0] — 2026-07-14

### Added

- Bracket generators: Round Robin, Swiss, Pool Play, Double Elimination (Worker)
- Start route now routes to correct generator based on bracket_type
- ManagePage: match result reporting UI (P1 Wins, P2 Wins, W.O.)
- Bracket generator tests (TDD RED → GREEN), 64 total worker tests

## [0.37.0] — 2026-07-14

### Added

- Tournament pages: ListPage (browse with status badges), CreatePage (with bracket type selector)
- DetailPage: tournament info, register button, participant list, D3 bracket visualization
- ManagePage: publish draft, start tournament, check-in participants
- D3.js bracket composable (useBracketD3) with SVG rendering
- 5 bracket types: single_elimination, double_elimination, round_robin, swiss, pool_play
- i18n keys: tournament section with all management labels

## [0.36.0] — 2026-07-14

### Changed

- Meta tags now internationalized via titleKey/descKey — switch with language
- usePageMeta uses useMeta() factory function for reactive locale switching

## [0.35.0] — 2026-07-14

### Added

- Header nav: active link bold via active-class="text-weight-bold"
- Nav items: NavItem interface with exact flag, header includes Home button
- Dynamic meta tags on login, signup, onboarding, profile (with @username), settings
- usePageMeta composable with Quasar Meta plugin integration

### Fixed

- Home page layout: flex-based instead of calc(100vh - 120px) to avoid header overlap

## [0.34.0] — 2026-07-14

### Changed

- MainLayout navbar: dark mode toggle, language switcher dropdown (en-US/pt-BR), user avatar dropdown (Settings + Logout)
- Guest navbar: dark mode, language switcher, Login + Sign Up buttons
- Drawer: updated links to list pages (/matches, /trading, /tournaments) instead of create pages

## [0.33.0] — 2026-07-14

### Added

- Settings page: edit display name, language selector (en-US/pt-BR), dark mode toggle, logout button
- i18n common keys: language, darkMode

## [0.32.0] — 2026-07-14

### Added

- Profile page: avatar, username, role badge, member since, event history
- i18n keys: profile section (title, memberSince, eventHistory, noEvents, role)
- Playwright test for profile page

## [0.31.0] — 2026-07-14

### Changed

- i18n audit: all hardcoded English strings replaced with $t() calls
- en-US and pt-BR translation files expanded with 30+ new keys
- Affected: match pages, trading pages, store pages, admin pages, home page
- Auth pages already used $t() — no changes needed

## [0.30.0] — 2026-07-14

### Added

- Trading pages: ListPage (browse), CreatePage (form), DetailPage (info, RSVP, attendees)
- Playwright tests for trading pages (list, create, detail)

## [0.29.0] — 2026-07-14

### Added

- Match pages: ListPage (status filter), CreatePage (form), DetailPage (info, join, participants)
- Playwright tests for match pages (list, create, detail)

## [0.28.0] — 2026-07-14

### Added

- Store pages: ListPage (browse + search), CreatePage (form), DetailPage (info + members), SettingsPage (edit)
- Playwright tests for store pages (list, create, detail)

## [0.27.0] — 2026-07-14

### Added

- `pnpm db:types` script for generating Supabase DB types
- Production wrangler.jsonc with KV namespace bindings and routing
- Deployment documentation with all required env vars and secrets
- Worker routing patterns for `api/*` endpoints

## [0.26.0] — 2026-07-14

### Changed

- supabase/config.toml regenerated to CLI v2 format
- Storage buckets configured: avatars (private, JPEG, 2MB) + logos (public, JPEG, 2MB)
- README prerequisites: Docker Desktop required for local Supabase

## [0.25.0] — 2026-07-14

### Added

- Playwright config now auto-starts both Quasar frontend + Hono Worker
- Root `dev:e2e` script starts all services + runs tests
- Root `.env.example` documenting all env vars for local dev
- README updated with e2e prerequisites (Supabase, env files)

## [0.24.0] — 2026-07-14

### Added

- Home page tests: Playwright (map, filter, geolocate, type filtering) + FilterBar unit test
- @vue/test-utils, jsdom, @vitejs/plugin-vue installed for component testing
- Vitest config updated to jsdom environment with Vue plugin
- 4 frontend tests total (3 store + 1 component)

## [0.23.0] — 2026-07-14

### Added

- Implemented spec-023: Home Page — Map, Event Feed & Filters
  - Leaflet map with OpenStreetMap tiles, color-coded markers by event type
  - Event feed cards with type badges and relative timestamps
  - Filter bar with event type pills (Matches, Trading, Tournaments)
  - Geolocation button ("Find near me")
  - Split layout: map (60%) + feed (40%) on desktop, stacked on mobile
  - Components: FilterBar, EventFeed, EventMap (organisms/home/)
  - Leaflet + @types/leaflet frontend dependencies

## [0.22.0] — 2026-07-14

### Added

- Implemented spec-022: Pinia Stores & Frontend Tests
  - `useEventStore` — Pinia store for shared event state (list, get, create, join, confirm)
  - `useStoreStore` — Pinia store for shared store state (list, get, create)
  - Vitest config + test setup for frontend package
  - Store tests: fetch list, handle empty, join event (3 tests)
  - ESLint and tsconfig exclude test/e2e directories
  - `pnpm test` added to frontend package

## [0.21.0] — 2026-07-14

### Added

- Implemented spec-021: Domain Composables
  - `@vueuse/core` installed — useGeolocation, useStorage, etc.
  - `useTcg` — list, create, remove TCGs
  - `useStore` — list, get, create, update, getMembers
  - `useEvent` — list (with filters), get, create, join, confirm, decline
  - `useTournament` — list, get, create, register, publish, start, getBracket
  - `useGeolocation` — wraps VueUse useGeolocation + Nominatim search
  - All composables use VITE_API_URL for API base URL

## [0.20.0] — 2026-07-14

### Added

- Implemented spec-020: Operations Setup
  - wrangler.jsonc: KV namespace bindings for GEOCODING_KV and RATE_LIMIT_KV
  - .env.example: updated with KV namespace IDs and all required env vars
  - Sentry: @sentry/hono dependency added, Sentry transport ready in logger
  - Turnstile: TurnstileWidget molecule component for CAPTCHA
  - POST /api/verify-turnstile endpoint in Worker
  - Signup page: Turnstile widget + token verification before signup

## [0.19.0] — 2026-07-14

### Added

- Implemented spec-019: Onboarding Page & Reusable Auth Components
  - Onboarding page: checks for existing admin, creates first admin via POST /api/auth/onboarding
  - AppCard atom: reusable card wrapper with title/content/actions slots
  - AuthForm molecule: configurable auth form with field selection (email, password, username, displayName)
  - LoginPage and SignupPage refactored to use AppCard + AuthForm
  - Components organized in atomic design structure (atoms/, molecules/)
  - Playwright tests (TDD RED → GREEN) for onboarding and component rendering

## [0.18.0] — 2026-07-14

### Added

- Implemented spec-018: Admin Pages (TDD)
  - TCG management: list with QTable, create dialog, soft-delete button
  - Format management: list/create under TCG, back navigation
  - User management: list users with role/status badges, ban/unban/promote
  - Report moderation: list with status badges, resolve/dismiss
  - Audit log: table with action badges
  - Dashboard: navigation cards to all admin sections
  - Store management: basic table view
  - Playwright baseline tests for all admin pages (TDD RED → GREEN)

## [0.17.0] — 2026-07-14

### Added

- Implemented spec-017: Hono RPC Client
  - `useApi` composable wrapping `hono/client` `hc()` with base URL from env
  - `hono` package added to frontend dependencies
  - Cached client singleton pattern (one client instance)
  - Ready for typed API calls once full type sharing is configured

## [0.16.0] — 2026-07-14

### Added

- Implemented spec-016: Playwright E2E Testing
  - Playwright with Chromium installed and configured
  - Baseline e2e tests: home page, login, signup, navigation, 404
  - `pnpm test:e2e` runs Playwright against Quasar dev server (auto-starts)
  - Dedicated `e2e/` directory for test files

## [0.15.0] — 2026-07-14

### Added

- Added missing index/listing page routes: `/matches`, `/trading`, `/tournaments`, `/admin/tcgs/:id/formats`, `/admin/stores`, `/admin/stores/:id`
- Organized pages by domain: `auth/`, `matches/`, `trading/`, `tournaments/`, `stores/`, `admin/`
- Standardized i18n structure: `pt-BR/index.ts` now matches `en-US/index.ts` pattern

### Added

- Implemented spec-015: Frontend Foundation
  - Supabase Auth boot file + useAuthStore with signup/login/logout/session restore
  - useAppStore with theme and locale persistence via localStorage
  - Router with auth guards, admin guard, and onboarding redirect
  - i18n en-US and pt-BR with full translation sets (nav, auth, common, home, store, event)
  - MainLayout with responsive navigation drawer (home, stores, events, settings)
  - AdminLayout with admin navigation (dashboard, TCGs, users, reports, audit)
  - Login and Signup pages with form validation
  - All page stubs created for all routes (matches, trading, tournaments, stores, admin)
  - @supabase/supabase-js frontend dependency

## [0.14.0] — 2026-07-14

### Added

- Implemented spec-014: Logger Middleware (TDD)
  - Structured logger with levels: debug, info, warn, error, critical
  - Console transport (always), Sentry transport (when DSN configured)
  - LGPD sanitization: personal fields → `[SANITIZED]`, tokens/passwords stripped
  - `debug` level active only in development mode
  - `critical` always logs errors with stack traces via Sentry
  - Integrated into Worker's `onError` handler
  - 5 new tests, 60 total passing

## [0.13.0] — 2026-07-14

### Added

- Implemented spec-013: Rate Limiting Middleware (TDD)
  - KV-backed `rateLimitMiddleware(action, maxRequests, windowSeconds)` factory
  - IP extraction from CF-Connecting-IP header
  - Applied to: POST /api/auth/onboarding (3/h), DELETE /api/auth/account (5/15m)
  - Returns 429 with error message when limit exceeded
  - 4 new tests, 54 total passing

## [0.12.0] — 2026-07-14

### Added

- Implemented spec-012: Notifications API (TDD)
  - Notifications: list (latest 50, unread first), mark as read, mark all as read, unread count
  - Push subscriptions: create (validates endpoint/p256dh/auth), delete (own only)
  - Auth middleware protects all notification routes
  - 5 new tests (TDD RED → GREEN), 50 total passing

## [0.11.0] — 2026-07-14

### Added

- Implemented spec-011: Moderation API (TDD)
  - Reports: create (auth), list (admin), resolve/dismiss (admin) with admin_notes
  - User moderation: ban/unban (sets banned_at), promote to admin, remove avatar
  - Audit log: auto-logged on all moderation actions, list (admin, last 100)
  - All admin routes protected by authMiddleware + adminMiddleware
  - 5 new tests (TDD RED → GREEN), 45 total passing

## [0.10.0] — 2026-07-14

### Added

- Implemented spec-010: Geocoding API (TDD)
  - `GET /api/geocode/search?q=` — proxy Nominatim autocomplete search with KV cache (24h TTL)
  - `GET /api/geocode/reverse?lat=&lng=` — proxy Nominatim reverse geocoding with KV cache
  - KV caching: cached flag in response meta, avoids repeated Nominatim calls
  - Proper error handling: 400 for missing params, 502 for upstream failures
  - Nominatim usage policy: User-Agent header set via env
  - 6 new tests (TDD RED → GREEN), 40 total passing

## [0.9.0] — 2026-07-14

### Added

- Implemented spec-009: code quality — DRY test utilities & no-any rule
  - Extracted shared test utilities into `src/test-utils/supabase.ts`: `chain()`, `makeApp()`, `authMock()`, `userChain()`, `makeUser()`, `env`, `testUserId`
  - Removed all duplicate `chain`/`chainBuilder`/`authMock`/`makeApp` functions from test files
  - Removed old `test-utils/mocks.ts` and `test-utils/helpers.ts`
  - No `as any` in production code (verified across all worker source files)
- AGENTS.md: added explicit "No `any` types" rule in Code Quality section

### Changed

- All 7 test files refactored to import shared utilities from `src/test-utils/supabase.ts`
- Test files use `as ReturnType<typeof vi.fn>` casts instead of `as any`

## [0.8.0] — 2026-07-14

### Added

- Implemented spec-008: Tournaments API (TDD)
  - Tournament CRUD: create (draft), list, get, update, publish (→open), cancel
  - Registration: register (pending), check-in (organizer)
  - Start tournament: single-elimination bracket generation (rounds + matches with next_match advancement)
  - Bracket queries: get rounds + matches
  - Match reporting: report result (advances winner), walkover (W.O.)
  - Fixed bracket generation float index bug in nextMatchIndex calculation
  - 5 new tests (TDD RED → GREEN), 34 total passing

## [0.7.0] — 2026-07-14

### Added

- Implemented spec-007: Events API — Matches & Trading Sessions (TDD)
  - Event CRUD: list (with filters), get (with participant count), create, update, cancel
  - Participant management: join (match only), confirm, decline, list
  - Status defaults: `open` for matches, `planned` for trading sessions
  - Creator-only guards for update/cancel; join validations (not own event, not full, not duplicate)
  - 6 new tests (TDD RED → GREEN), 29 total passing

## [0.6.0] — 2026-07-14

### Added

- Implemented spec-006: Game Stores API (TDD)
  - Store routes: list (public), get (public), create (auth), update (owner/manager), soft-delete (admin)
  - Store memberships: list (owner/manager), add (owner/manager), remove member (owner, last-owner protection)
  - Admin operations: verify store, suspend store with reason
  - Auto-generated slug from store name on creation
  - Owner auto-assigned on store creation, rollback on membership failure
  - Created shared `chainBuilder` test utility for Supabase mock chains
  - 6 new tests, 23 total, all passing (TDD: RED → GREEN)

## [0.5.0] — 2026-07-14

### Added

- Implemented spec-005: test backfill & TDD infrastructure
  - Vitest configuration for worker package
  - Test utilities: mock data factories, Supabase mock helper
  - Auth middleware tests: 6 cases (missing header, invalid token, banned, deleted, valid user)
  - Admin middleware tests: 2 cases (403 non-admin, pass for admin)
  - Auth route tests: 4 cases (onboarding with/without admin, me authenticated/not)
  - TCG route tests: 5 cases (list, 401, 403, create, soft-delete)

### Changed

- Moved test utilities inside `src/` for tsconfig compatibility
- Established testing patterns (Hono `app.request()`, `vi.mock` for Supabase)

## [0.4.0] — 2026-07-14

### Added

- Implemented spec-004: TCGs & Formats API
  - Admin middleware (`middleware/admin.ts`) — role check, returns 403 for non-admins
  - Updated shared schemas: `UpdateTcgSchema`, `UpdateFormatSchema`
  - `GET /api/tcgs` — list non-deleted TCGs (public)
  - `GET /api/tcgs/:id` — get TCG by ID (public)
  - `POST /api/tcgs` — create TCG (admin)
  - `PATCH /api/tcgs/:id` — update TCG (admin)
  - `DELETE /api/tcgs/:id` — soft-delete TCG (admin)
  - `GET /api/tcgs/:tcgId/formats` — list formats for a TCG (public)
  - `POST /api/tcgs/:tcgId/formats` — create format (admin)
  - `PATCH /api/formats/:id` — update format (admin)
  - `DELETE /api/formats/:id` — soft-delete format (admin)

## [0.3.0] — 2026-07-14

### Added

- Implemented spec-003: complete database schema
  - Second Supabase migration with 12 tables: tcgs, formats, game_stores, store_memberships, events, event_participants, bracket_rounds, bracket_matches, notifications, push_subscriptions, reports, audit_log
  - All tables have RLS enabled, UUID PKs, FKs with appropriate ON DELETE behavior, CHECK constraints
  - Partial unique index on store_memberships to enforce one owner per store
  - Event organizer constraint (exactly one of organizer_user_id / organizer_store_id)
  - Shared package Zod schemas: tcg, store, event, tournament, notification, report
  - Types for all new domain entities

## [0.2.0] — 2026-07-14

### Added

- Implemented spec-002: auth system
  - `@supabase/supabase-js` dependency for Worker
  - Supabase client factory (`packages/worker/src/db/client.ts`) — secret key for DB, auth client for JWT verify
  - JWT verification + banned check middleware (`packages/worker/src/middleware/auth.ts`)
  - Auth API routes under `/api/auth`:
    - `GET /api/auth/onboarding` — check if admin exists
    - `POST /api/auth/onboarding` — create first admin
    - `GET /api/auth/me` — current user profile
    - `PATCH /api/auth/profile` — update display_name
    - `POST /api/auth/suspend` — suspend account
    - `POST /api/auth/export` — export personal data (LGPD)
    - `DELETE /api/auth/account` — delete account (with last admin protection)
  - Updated shared schemas: `OnboardingStatusSchema`, `UserResponseSchema`, `AccountActionResponseSchema`
  - All routes return consistent `{ data, error, meta }` envelope

## [0.1.0] — 2026-07-14

### Added

- Implemented spec-001: project infrastructure scaffolding
  - Root configs: `package.json`, `tsconfig.base.json`, `.prettierrc`, `.eslintrc.cjs`, `.gitignore`
  - `@tcg/shared` package: Zod schemas (`common.ts`, `user.ts`), types, constants
  - `@tcg/worker` package: Hono app skeleton with CORS, `wrangler.jsonc`, env template
  - `@tcg/frontend` package: Quasar SPA scaffolded with TypeScript, Pinia, ESLint, i18n, Sass — routes, stores, layouts, stub pages
  - `supabase/` config and initial migration (PostGIS + `public.users` + `public.consents` tables with RLS)
- SDD commit step: added `Commit` as step 5 in AGENTS.md workflow

### Changed

- AGENTS.md: SDD workflow extended from `Spec → Plan → Tasks → Code` to `Spec → Plan → Tasks → Code → Commit`

## [0.0.0] — 2026-07-14

### Added

- Project initialization
- Stack decision: Quasar (Vue 3 + Vite) + Hono (Cloudflare Workers) + Supabase (Postgres + Auth)
- Architecture planning documents:
  - `docs/data-model.md` — Entity definitions for Users, TCGs, Formats, Game Stores, Matches, Tournaments, Brackets
  - `docs/requirements.md` — Functional and non-functional requirements
  - `docs/use-cases.md` — 26 use cases covering all user roles
  - `docs/pages.md` — Route map and component organization
  - `AGENTS.md` — Project conventions and AI-assisted development guide
- Skills added to `.agents/skills/`:
  - test-driven-development
  - tdd
  - supabase
  - supabase-postgres-best-practices
  - create-specification
  - brainstorming
  - frontend-design
  - design-taste-frontend
  - cloudflare, wrangler, workers-best-practices
  - agents-sdk, durable-objects
  - cloudflare-email-service, turnstile-spin
  - web-perf, code-review, code-simplifier, security-review
  - agents-md, skill-writer
  - sandbox-sdk

### Changed

- Supabase API keys: replaced `service_role`/`anon` (JWT, legacy) with **secret key** (`sb_secret_...`) for Hono Workers and **publishable key** (`sb_publishable_...`) for frontend auth. Auth flow updated accordingly.
- LGPD compliance improvements:
  - Account deletion now permanently removes Supabase Auth user (email erased); same email can be re-registered
  - Added data export (portability), consent recording, account suspension
  - Custom SMTP via **Resend** for transactional emails (avoids Supabase suspension risk)
  - Security: Turnstile CAPTCHA on signup, KV rate limiting, account locking after failed attempts
- Observability: Sentry for error tracking, centralized structured logger with LGPD sanitization
- Added tools to stack: VueUse, hono/client, Zod, Luxon, @vue/test-utils, MSW
- Added: Supabase Realtime, Cloudflare KV, ESLint + Prettier + Husky, Supabase CLI
- Added: Technical tips section in AGENTS.md (monorepo structure, Hono RPC, CORS, direct uploads, PostGIS, notifications, bracket types, env vars, pagination, worker testing)
- Added: `pool_play` bracket type (5 total: single elim, double elim, round robin, swiss, pool play)
- Added: D3.js for bracket visualization

### Changed

- Store model: replaced admin pre-approval with free store creation + moderation
  - Added `store_memberships` table with roles: owner, manager, staff
  - Store owner can transfer ownership; managers add staff; staff record results
  - Admin verifies stores (`is_verified`) and can suspend for impersonation
  - Added generic `reports` table for store/user/event reports
- Event organizer model: replaced `creator_id`/`creator_type` with `created_by_user_id` + `organizer_user_id` / `organizer_store_id`
- Participant confirmation flow: join/RSVP/register sets status `pending`; explicit confirmation moves to `confirmed`
- Tournament bracket advancement: added `next_match_id` and `next_match_player_slot` to `bracket_matches`
- Tournament walkover (W.O.): `bracket_matches.status` now includes `walkover`

### Added

- `consents` table for LGPD consent recording
- `notifications` table for Supabase Realtime in-app notifications
- Match result tracking via `event_participants.score` and `event_participants.placement`
- Data export returns JSON immediately (removed "within 24h" wording)
- Updated docs: `docs/data-model.md`, `docs/requirements.md`, `docs/use-cases.md` (now 36 UCs), `docs/pages.md`
- Added onboarding flow: `/onboarding` creates the first admin when no users exist; hidden once an admin exists
- Added admin promotion: only admins can promote users to admin
- Added last-admin deletion protection: the sole admin cannot delete their account until another admin is promoted
- Added browser push notifications (Web Push API) triggered by Supabase Realtime notification inserts
- Added event invitations: creators can invite registered users to matches, trading sessions, and tournaments
- Added SEO & discoverability requirements: semantic HTML, dynamic meta/OpenGraph/Twitter Cards, canonical URLs, `robots.txt`, `sitemap.xml`, JSON-LD, locale-aware `lang` attribute, hybrid approach (Quasar Meta + prerender + dynamic rendering for crawlers)
- Set pnpm as the default package manager; added `pnpm-workspace.yaml`

### Changed

- Updated project structure in docs and README to reflect full monorepo layout and domain-driven design in the Worker
