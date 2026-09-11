---
title: Detail Page Card Refactor — Extract ParticipantListCard and EventHeaderCard Molecules
version: 1.0
date_created: 2026-09-11
tags: frontend, refactor, molecules, dry
---

# Introduction

The four detail pages (`matches`, `trading`, `tournaments`, `stores`) contain near-identical card markup. The participant/member list card is copy-pasted across all four pages, and the event header card (title + status badge + participation actions) is duplicated across the match and trading detail pages. This spec extracts those cards into reusable **molecules** and updates the pages to consume them, removing duplication and centralizing the shared participation-action logic.

## 1. Purpose & Scope

Extract two reusable card molecules from duplicated detail-page markup, following the atomic-design conventions in `AGENTS.md` (entity cards live in `src/components/molecules/cards/`). Update the four detail pages to use them and keep all existing page behavior and layout identical.

**In scope**

- `matches/DetailPage.vue`, `trading/DetailPage.vue`, `tournaments/DetailPage.vue`, `stores/DetailPage.vue`.
- New molecules `ParticipantListCard` and `EventHeaderCard`.
- Component tests for the new molecules.
- Docs (`docs/pages.md`) component tree update.

**Out of scope**

- The tournament bracket card, the store map/header card, create/list pages, and any worker/API changes.
- Changing status colors or i18n strings (behavior is preserved as-is).

## 2. Definitions

- **Molecule**: A component composed of atoms (e.g. `StatusBadge`) plus Quasar primitives (`q-card`, `q-list`, `q-item`) with a single purpose, reusable across features. Lives in `src/components/molecules/`.
- **Organism**: A feature-specific section composed of molecules + atoms, living in `src/components/organisms/<feature>/`. Feature-specific sections with check-in or scoring controls (e.g. `organisms/tournament/ParticipantListSection`, `BracketMatchSection`) are NOT in scope.
- **Participation**: The current user's RSVP/attendance record for an event (`{ user_id, status }`).

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: A new `ParticipantListCard` molecule shall render the card shell, title, and a list of participants with a per-row badge. It shall be used by all four detail pages, replacing their duplicated `q-card`/`q-list`/`q-item` blocks.
- **REQ-002**: `ParticipantListCard` shall support a `badgeKey` prop of `'status'` (renders `StatusBadge` with the participant status) or `'role'` (renders a plain badge with the member role), covering both the event participants cards and the store members card.
- **REQ-003**: `ParticipantListCard` shall show an empty-state message when `emptyText` is provided and the list is empty (used by tournaments and stores); when `emptyText` is absent it renders an empty list without the empty-state section (matches/trading behavior).
- **REQ-004**: A new `EventHeaderCard` molecule shall render the event header card: `<h5>` title, `StatusBadge`, an optional `meta` slot (second `q-card-section`), and the participation `confirm`/`decline` buttons plus `confirmed` badge driven by the `participation` prop.
- **REQ-005**: `EventHeaderCard` shall expose an `actions` slot for page-specific buttons (join/RSVP/register) so page-specific visibility rules and loading states stay in the page.
- **REQ-006**: Both molecules shall be placed under `src/components/molecules/cards/` (new directory) per the atomic-design conventions for entity cards.
- **REQ-007**: The four detail pages shall render identically after the refactor (same DOM structure, classes, order, and visible text) with no layout change.
- **REQ-008**: All user-facing strings in the molecules shall use `$t()` with the existing i18n keys (`event.confirm`, `event.decline`, `event.confirmed`); no new keys required.
- **GUD-001**: Follow existing component conventions: `<script setup lang="ts">`, no `any` types, `StatusBadge` for status labels, props typed via `interface`.
- **GUD-002**: Keep each detail page under the 200-line ceiling; the refactor shall not add lines to pages.

## 4. Interfaces & Data Contracts

### `ParticipantListCard` — `src/components/molecules/cards/ParticipantListCard.vue`

```ts
export interface Participant {
  id: string;
  user_id?: string;
  username?: string;
  status?: string;
  role?: string;
}

interface Props {
  title: string; // card heading, e.g. $t('event.participants')
  participants: Participant[];
  badgeKey?: 'status' | 'role'; // default: 'status'
  emptyText?: string; // when set and participants is empty, show empty-state section
}
```

Rendered item label: `participant.username || participant.user_id?.slice(0, 8)` (same as current pages).

### `EventHeaderCard` — `src/components/molecules/cards/EventHeaderCard.vue`

```ts
export interface Participation {
  user_id?: string;
  status?: string;
}

interface Props {
  title: string;
  status: string;
  participation: Participation | null;
  confirming?: boolean;    // default: false
  declining?: boolean;     // default: false
}

// Events
emit('confirm');
emit('decline');

// Slots
slot default;    // meta content rendered in a second q-card-section (date/players row, details, etc.)
slot 'actions';  // page-specific buttons rendered after the participation actions
```

Rendered participation actions (identical to current pages):

- `confirm` button — shown when `participation?.status === 'pending'`, label `$t('event.confirm')`, `:loading="confirming"`.
- `decline` button — shown when `participation?.status === 'pending'`, flat/negative, label `$t('event.decline')`, `:loading="declining"`.
- `confirmed` badge — shown when `participation?.status === 'confirmed'`, color positive, label `$t('event.confirmed')`.

## 5. Acceptance Criteria

- **AC-001**: Given the match detail page, When rendered, Then the participants card markup comes from `ParticipantListCard` and shows username/user_id with a colored status badge.
- **AC-002**: Given the trading detail page, When rendered, Then the participants card and header card come from the new molecules and render the same text/actions as before.
- **AC-003**: Given the tournament detail page, When it has zero participants, Then `ParticipantListCard` shows the `tournament.noParticipants` empty state.
- **AC-004**: Given the store detail page, When rendered, Then the members card uses `ParticipantListCard` with `badgeKey="role"` and shows the `store.noMembers` empty state when empty.
- **AC-005**: Given a match/trading session where the current user's participation status is `pending`, When the header card renders, Then `confirm` and `decline` buttons appear and emit `confirm`/`decline` respectively.
- **AC-006**: Given a match/trading session where the current user's participation status is `confirmed`, When the header card renders, Then the positive `confirmed` badge appears and no action buttons are shown.
- **AC-007**: Given the match detail page, When `match.status` is `open` and there is no participation, Then the `join` button (page-owned, in the `actions` slot) is visible; otherwise it is not.
- **AC-008**: Given the trading detail page, When the session status is `planned` or `active`, Then the RSVP button renders with `:disable` when a participation exists (behavior preserved).
- **AC-009**: Given any of the four detail pages, When the page loads, Then the existing `store.get`/`apiGet` calls and loading states are unchanged and all existing page tests pass.
- **AC-010**: Given the `docs/pages.md` component tree, When the refactor is complete, Then `ParticipantListCard` and `EventHeaderCard` are listed under `molecules/cards/`.

## 6. Test Automation Strategy

- **Test Levels**: Unit (component) tests for the new molecules; existing page tests are regression checks.
- **Frameworks**: Vitest + `@vue/test-utils` (`shallowMount`), following the existing molecule spec style (`src/components/molecules/__tests__/*.spec.ts`).
- **`ParticipantListCard.spec.ts`**:
  - Renders the title heading.
  - Renders one row per participant, label = `username` fallback to truncated `user_id`.
  - `badgeKey="status"` renders a `StatusBadge`; `badgeKey="role"` renders a plain badge with the role text.
  - With `emptyText` and zero participants, renders the empty-state text; without `emptyText`, renders no empty-state section.
- **`EventHeaderCard.spec.ts`**:
  - Renders title and `StatusBadge`.
  - `participation.status === 'pending'` shows `confirm` and `decline` buttons and emits the events when clicked.
  - `participation.status === 'confirmed'` shows the `confirmed` badge and no buttons.
  - `participation === null` renders no participation actions.
  - `actions` slot content is rendered inside `q-card-actions`.
  - `confirming`/`declining` loading props forward to the respective buttons.
- **Regression**: existing `MatchDetailPage.test.ts` and `RemainingDetailPages.test.ts` must pass unchanged (shallow mounts auto-stub the new molecules).
- **CI/CD Integration**: run via `pnpm test` and `pnpm lint` in the pre-push pipeline.

## 7. Rationale & Context

The participant/member list card is byte-for-byte duplicated in matches, trading, tournaments (participants) and stores (members, with a role badge). The event header card is duplicated between matches and trading, including the identical `confirm`/`decline`/`confirmed` participation logic. Tournament and store headers differ enough that only their shared card _types_ are extracted, not their unique headers.

**Molecule vs organism decision**: both extractions are **molecules**, not organisms. Organisms are feature-specific sections composed of molecules + atoms and live under `organisms/<feature>/`; these cards are generic, single-purpose, and span multiple features (matches, trading, tournaments, stores), so they belong in `molecules/cards/` alongside the entity-card convention (`EventCard`, `UserCard`, `StoreCard`). The existing `organisms/tournament/ParticipantListSection` (check-in input + participants) and `BracketMatchSection` remain untouched because they carry tournament-specific controls.

The page-owned `actions` slot on `EventHeaderCard` keeps genuinely page-specific logic (join/RSVP/register button visibility, disable rules, loading flags) in the page while centralizing the identical participation actions. `ParticipantListCard`'s `badgeKey` prop covers the store members variant without a second component.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: None. This is a frontend-only refactor; no API, database, or Worker changes.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: Participant payload shape from `GET /api/events/:id/participants` (`{ id, user_id, username, status }`) and store members from `useStoreStore.getMembers` (`{ id, user_id, username, role }`).

### Technology Platform Dependencies

- **PLT-001**: Vue 3 Composition API (`<script setup>`), Quasar `q-card`/`q-list`/`q-item`/`q-badge`/`q-btn`, vue-i18n via `$t()`.

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

```vue
<!-- ParticipantListCard usage (tournaments detail) -->
<ParticipantListCard
  :title="$t('event.participants')"
  :participants="participants"
  :empty-text="$t('tournament.noParticipants')"
/>

<!-- ParticipantListCard usage (stores detail, role badges) -->
<ParticipantListCard
  :title="$t('store.members')"
  :participants="members"
  badge-key="role"
  :empty-text="$t('store.noMembers')"
/>

<!-- EventHeaderCard usage (matches detail) -->
<EventHeaderCard
  :title="$t('event.matchDetails')"
  :status="match!.status"
  :participation="myParticipation"
  :confirming="confirming"
  :declining="declining"
  @confirm="confirmAttendance"
  @decline="declineAttendance"
>
  <div class="row q-col-gutter-sm">
    <div class="col-6"><strong>{{ $t('event.date') }}:</strong> {{ formatDate(...) }}</div>
    <div class="col-6"><strong>{{ $t('event.players') }}:</strong> {{ max_participants || 2 }}</div>
  </div>
  <template #actions>
    <q-btn
      v-if="!myParticipation && match!.status === 'open'"
      color="primary"
      :label="$t('event.join')"
      :loading="joining"
      @click="join"
    />
  </template>
</EventHeaderCard>
```

Edge cases:

- Participant row with neither `username` nor `user_id` renders an empty label (current behavior preserved).
- `myParticipation` is `null` when the user is not signed in; `EventHeaderCard` then renders no participation actions.
- Tournament detail passes `participation=null`; only the register button (actions slot) appears.
- Store members card must NOT use `StatusBadge` for roles; `badgeKey="role"` renders a plain badge so role text is not i18n-mapped as a status.

## 10. Validation Criteria

- `pnpm test` passes (frontend suite, including new molecule specs and existing page specs).
- `pnpm lint` and `pnpm typecheck` pass.
- `pnpm knip` reports no new dead exports.
- Manual check of all four detail pages in `quasar dev` renders identically to before the refactor.

## 11. Related Specifications / Further Reading

- `spec-070-audit-remediation-p1.md` — frontend DRY and quality guidelines (page size ceiling, reusable components, StatusBadge usage)
- `spec-059-appcard-refactor.md` — prior component extraction/move pattern (atom → molecule)
- `docs/pages.md` — component tree (molecules/cards section)
