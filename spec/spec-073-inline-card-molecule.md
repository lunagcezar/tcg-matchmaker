---
title: Shared Inline Card Molecule — AppPanelCard for Title + Content Repetition
version: 1.0
date_created: 2026-09-11
tags: frontend, refactor, molecules, dry
---

# Introduction

Many UI cards repeat the same "title + body (+ optional actions / status badge)" structure. `AppCard` already encapsulates a title + body + notifications + actions panel, but it is a **full-page, centered page-shell** (`q-page.flex.flex-center` + a custom `.app-panel` div), not an inline `q-card`. It cannot be reused for the inline content cards scattered across detail pages and organisms. This spec introduces a single reusable **inline card molecule** (`AppPanelCard`) that captures the common title + body + actions layout, and refactors the existing inline card components to consume it — eliminating duplicated `q-card`/`q-card-section`/`q-card-actions` boilerplate.

## 1. Purpose & Scope

**Decision: `AppCard` should NOT be made compatible with every case.** Its `q-page` wrapper and centered-flex layout are required by the auth/create-form use cases and are irrelevant to inline content cards. Reusing it for inline cards would force page semantics onto content cards and break its existing callers. Instead, a new **inline card molecule** is introduced to serve the content-card cases.

**In scope**

- New molecule `AppPanelCard` (`src/components/molecules/cards/AppPanelCard.vue`).
- Refactor the following inline `q-card` components to use `AppPanelCard`:
  - `molecules/cards/EventHeaderCard.vue`
  - `molecules/cards/ParticipantListCard.vue`
  - `organisms/tournament/TournamentManageHeader.vue`
  - `organisms/tournament/BracketMatchSection.vue`
  - `organisms/tournament/ParticipantListSection.vue`
  - `molecules/AdminFormDialog.vue`
  - inline cards in `pages/admin/StoreManageDetailPage.vue` (store details / manage / members)
  - inline bracket card in `pages/tournaments/DetailPage.vue`
- Component tests for `AppPanelCard`.
- Docs (`docs/pages.md`) component tree update.

**Out of scope**

- `AppCard` itself (page-shell panel) is unchanged; it stays for auth/create pages.
- `ConfirmDeleteDialog` and any dialog that wraps a `q-card` differently.
- The store header card on `pages/stores/DetailPage.vue` (title + verified icon + address) — kept as-is unless it cleanly maps to `AppPanelCard`.
- Any API, i18n, or styling token changes beyond what is needed for the shared card.

## 2. Definitions

- **Page-shell panel**: A full-viewport layout component (`AppCard`) that wraps a `q-page`, centers its content, and owns page-level spacing. Not a `q-card`.
- **Inline card**: A `q-card` rendered inside a page's normal flow (not wrapping `q-page`), used to group a titled section of content.
- **Slot**: A Vue named/content slot used to inject child markup into a component.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: A new `AppPanelCard` molecule shall render a `q-card` with a `title` header (`q-card-section` + heading) and a default slot rendered directly inside the `q-card`.
- **REQ-002**: `AppPanelCard` shall support an optional `actions` slot rendered in a `q-card-actions` section, present only when the slot is provided.
- **REQ-003**: `AppPanelCard` shall support a `title` slot to override the default heading (used for the status badge row on `EventHeaderCard`/`TournamentManageHeader` and the badge row on the store details card).
- **REQ-004**: The title heading shall be a `<h6 class="q-my-none">` by default, overridable via a `titleTag` prop (`h5` | `h6`) to preserve current heading levels.
- **REQ-005**: `AppPanelCard` shall forward a `cardClass` prop onto the root `q-card` (to keep the `q-mt-md` spacing used by `ParticipantListCard`, `BracketMatchSection`, `ParticipantListSection`, and the tournament bracket card).
- **REQ-006**: `AppPanelCard` shall forward `actionsClass` and `actionsAlign` props to `q-card-actions` so consumers can preserve existing action spacing and alignment (e.g. `EventHeaderCard` uses `q-pa-md q-gutter-sm`; `AdminFormDialog` uses `align="right"`).
- **REQ-007**: The title and actions sections shall be rendered only when their respective prop/slot is present, so a card can omit either of them.
- **REQ-008**: All user-facing strings remain in the consuming components; `AppPanelCard` only accepts a plain `title` string and does not do i18n.
- **REQ-007**: All existing inline card components shall render identically after refactoring to `AppPanelCard` (same DOM structure, classes, heading level, and order) with no visual change.
- **REQ-008**: All user-facing strings remain in the consuming components; `AppPanelCard` only accepts a plain `title` string and does not do i18n.
- **GUD-001**: Follow existing conventions: `<script setup lang="ts">`, typed props, no `any`, `q-my-none` on headings.
- **GUD-002**: Do not modify `AppCard`; it is intentionally a separate page-shell component.
- **GUD-003**: Keep each refactored file's line count at or below its current level where reasonable.

## 4. Interfaces & Data Contracts

### `AppPanelCard` — `src/components/molecules/cards/AppPanelCard.vue`

```ts
type ActionsAlign = 'center' | 'left' | 'right' | 'stretch' | 'between' | 'around' | 'evenly';

interface Props {
  title?: string;           // plain heading text; no i18n applied here
  titleTag?: 'h5' | 'h6';   // default: 'h6'
  cardClass?: string;       // extra classes on root q-card, e.g. 'q-mt-md'
  actionsClass?: string;    // extra classes on q-card-actions, e.g. 'q-pa-md q-gutter-sm'
  actionsAlign?: ActionsAlign; // forwarded to q-card-actions align prop
}

// Slots
slot default;      // body content, rendered directly inside q-card (consumers provide their own q-card-section/q-list as needed)
slot title;        // rendered inside the title q-card-section, overriding the default heading
slot 'actions';    // rendered inside q-card-actions
```

Rendered structure (when the corresponding slot/prop is present):

```html
<q-card :class="cardClass">
  <q-card-section>
    <slot name="title">
      <h6 class="q-my-none">{{ title }}</h6>
    </slot>
  </q-card-section>
  <slot />
  <q-card-actions :class="actionsClass" :align="actionsAlign">
    <slot name="actions" />
  </q-card-actions>
</q-card>
```

## 5. Acceptance Criteria

- **AC-001**: Given a component using `<AppPanelCard title="X">body</AppPanelCard>`, When rendered, Then a `q-card` shows the `<h6>` title and the body content.
- **AC-002**: Given `AppPanelCard` with a `title` slot, When rendered, Then the slot renders inside the title `q-card-section` instead of the default heading.
- **AC-003**: Given `AppPanelCard` with an `actions` slot, When rendered, Then an actions section appears inside `q-card-actions`; when no actions slot is provided, no actions section is rendered.
- **AC-004**: Given `AppPanelCard` with `titleTag="h5"`, When rendered, Then the heading is `<h5>`; default is `<h6>`.
- **AC-005**: Given `AppPanelCard` with `card-class="q-mt-md"`, When rendered, Then the root `q-card` has the `q-mt-md` class.
- **AC-006**: Given `AppPanelCard` with `actions-class="q-pa-md"` and `actions-align="right"`, When rendered, Then `q-card-actions` receives the class and align props.
- **AC-007**: Given `EventHeaderCard`, When rendered, Then it produces the same title, status badge, participation actions, and meta content as before, now composed from `AppPanelCard`.
- **AC-008**: Given `ParticipantListCard`, When rendered with participants, Then it shows the title and the participant list; the `q-mt-md` spacing is preserved.
- **AC-009**: Given `TournamentManageHeader`, `BracketMatchSection`, `ParticipantListSection`, and `AdminFormDialog`, When rendered, Then each renders identically to its pre-refactor version.
- **AC-010**: Given `StoreManageDetailPage` and `tournaments/DetailPage` (bracket card), When rendered, Then their inline cards use `AppPanelCard` and render identically.
- **AC-011**: Given the `docs/pages.md` component tree, When the refactor is complete, Then `AppPanelCard` is listed under `molecules/cards/`.

## 6. Test Automation Strategy

- **Test Levels**: Unit (component) tests for `AppPanelCard`; existing page/molecule tests are regression checks.
- **Frameworks**: Vitest + `@vue/test-utils` (`shallowMount`), following the existing molecule spec style in `src/components/molecules/cards/__tests__/`.
- **`AppPanelCard.spec.ts`**:
  - Renders the title heading (default `<h6>`).
  - `titleTag="h5"` renders `<h5>`.
  - Renders `title` slot inside the title section.
  - Renders default body slot content directly inside `q-card`.
  - Renders `actions` slot inside `q-card-actions`; omits the actions section when the slot is absent.
  - Forwards `actionsClass` and `actionsAlign` to `q-card-actions`.
  - Declares a `cardClass` prop forwarded to the root `q-card`.
- **Regression**: existing `AppCard.test.ts`, `EventHeaderCard.spec.ts`, `ParticipantListCard.spec.ts`, `MatchDetailPage.test.ts`, `RemainingDetailPages.test.ts`, and `ManageAndSpecialPages.test.ts` must pass unchanged or with minimal, additive assertions.
- **CI/CD Integration**: run via `pnpm test`, `pnpm lint`, `pnpm typecheck` in the pre-push pipeline.

## 7. Rationale & Context

The "title + content (+ actions)" pattern is repeated in at least seven components. `AppCard` already embodies this pattern but is tightly coupled to page-shell semantics (`q-page`, `flex flex-center`, `.app-panel` with custom `--card` styling). Making `AppCard` render a plain `q-card` inline (e.g. via a flag) would complicate its API, weaken its purpose, and risk regressing auth/create pages. A dedicated inline card molecule keeps the two concerns separate and gives content cards a single source of truth for their structure.

**Why `molecules/cards/`**: consistent with the entity-card convention established in `spec-072` and documented in `docs/pages.md` (`molecules/cards/` hosts `EventCard`, `UserCard`, `StoreCard`, `ParticipantListCard`, `EventHeaderCard`).

The `title` slot covers the status-badge and badge-row variants (`EventHeaderCard`, `TournamentManageHeader`, store details card) without adding a generic `status` prop, keeping `AppPanelCard` agnostic. The default slot is direct so consumers can mix `q-card-section`, `q-list`, and other Quasar card children as needed. The `actionsClass`/`actionsAlign` props preserve existing action layouts without bloating the slot API.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: None. Frontend-only refactor; no API, database, or Worker changes.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: None new. Consuming components already supply the data they render.

### Technology Platform Dependencies

- **PLT-001**: Vue 3 Composition API (`<script setup>`), Quasar `q-card`/`q-card-section`/`q-card-actions`, existing heading semantics (`h5`/`h6` with `q-my-none`).

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

```vue
<!-- Refactored ParticipantListCard body using AppPanelCard -->
<AppPanelCard title="Participants" card-class="q-mt-md">
  <q-card-section v-if="participants.length === 0 && emptyText" class="text-grey">
    {{ emptyText }}
  </q-card-section>
  <q-list v-else-if="participants.length > 0">
    <q-item v-for="p in participants" :key="p.id">
      <q-item-section>{{ p.username || p.user_id?.slice(0, 8) }}</q-item-section>
      <q-item-section side>
        <StatusBadge v-if="badgeKey === 'status'" :status="p.status || ''" />
        <q-badge v-else>{{ p.role }}</q-badge>
      </q-item-section>
    </q-item>
  </q-list>
</AppPanelCard>
```

```vue
<!-- Refactored EventHeaderCard using AppPanelCard with title + actions slots -->
<AppPanelCard actions-class="q-pa-md q-gutter-sm">
  <template #title>
    <h5 class="q-my-none">{{ title }}</h5>
    <StatusBadge :status="status" class="q-mt-sm" />
  </template>
  <q-card-section v-if="$slots.default">
    <slot />
  </q-card-section>
  <template #actions>
    <q-btn v-if="participation?.status === 'pending'" ... />
    <slot name="actions" />
  </template>
</AppPanelCard>
```

Edge cases:

- `AdminFormDialog` uses default `titleTag="h6"`, wraps its body in a `q-card-section`, and uses `actions-align="right"` for its cancel/submit buttons.
- A card with no title (e.g. if a future consumer omits `title`) renders only the body and/or actions sections — the title section is conditionally rendered.
- `TournamentManageHeader` uses the `title` slot for its heading + status badge row, preserving its current `<h5>` heading.
- `StoreManageDetailPage` inline cards keep their custom header rows (verified/store status badges) via the `title` slot.

## 10. Validation Criteria

- `pnpm test` passes (frontend suite, including the new `AppPanelCard.spec.ts` and existing regression specs).
- `pnpm lint` and `pnpm typecheck` pass.
- `pnpm knip` reports no new dead exports.
- Manual check of detail pages, tournament manage page, store manage page, and admin form dialogs in `quasar dev` renders identically to before the refactor.

## 11. Related Specifications / Further Reading

- `spec-072-detail-page-card-refactor.md` — introduced `ParticipantListCard` and `EventHeaderCard` and the `molecules/cards/` convention
- `spec-070-audit-remediation-p1.md` — frontend DRY and quality guidelines (reusable components, page size ceiling)
- `spec-059-appcard-refactor.md` — prior `AppCard`/`AuthCard` consolidation and page-pattern unification
- `docs/pages.md` — component tree (molecules/cards section)
