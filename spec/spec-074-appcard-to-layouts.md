---
title: Move AppCard to Layouts — Rename to AppCardLayout
version: 1.0
date_created: 2026-09-11
tags: frontend, refactor, layout, architecture
---

# Introduction

`AppCard` (`src/components/molecules/AppCard.vue`) is a page-shell panel: it wraps `q-page`, applies flex centering, and owns page-level spacing. This is the Template layer's responsibility, not a molecule's. It is also structurally identical in role to the existing `AppDetailLayout`, `AppListLayout`, and `MapListLayout`, all of which live in `src/layouts/`. This spec moves `AppCard` into `src/layouts/` and renames it to `AppCardLayout`, so the layout/`molecules` boundary is clear and the upcoming inline `AppPanelCard` (spec-073) is not confused with a page shell.

## 1. Purpose & Scope

Relocate `AppCard` from `src/components/molecules/` to `src/layouts/` as `AppCardLayout`, update every import, and keep all rendering behavior identical. This is a mechanical, architecture-clarifying change.

**In scope**

- New file `src/layouts/AppCardLayout.vue` (moved and renamed from `src/components/molecules/AppCard.vue`).
- Update all importing files (auth pages, create pages, SettingsPage, and tests).
- Delete `src/components/molecules/AppCard.vue`.
- Docs (`docs/pages.md`) component tree update.

**Out of scope**

- Any change to `AppCard`'s props, slots, styling, or behavior.
- The inline `AppPanelCard` refactor (spec-073) and any other card work.
- Renaming the `AppCard` tag used in test stubs (they reference the component import, so the tag is irrelevant once imports are updated).

## 2. Definitions

- **Page-shell / Template layer**: Components in `src/layouts/` that wrap a `q-page` and define the outer page scaffold (e.g. `MainLayout`, `AppDetailLayout`, `AppListLayout`, `MapListLayout`).
- **Molecule**: A component composed of atoms plus Quasar primitives with a single purpose, in `src/components/molecules/`. Not a page wrapper.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: `AppCard` shall be relocated to `src/layouts/AppCardLayout.vue` with identical template, script, props, and scoped styles.
- **REQ-002**: Every existing import of `@/components/molecules/AppCard.vue` shall be updated to `@/layouts/AppCardLayout.vue`.
- **REQ-003**: The component's export name/class and its `<template>` root shall remain unchanged so consumers keep working with only the import path updated.
- **REQ-004**: The tag name used in consuming templates may remain `AppCard` (Vue resolves it from the import); no consumer markup needs renaming beyond the import.
- **REQ-005**: Existing tests that mount `AppCard` (`src/components/__tests__/AppCard.test.ts`) shall be relocated to `src/layouts/__tests__/AppCardLayout.test.ts` and updated to import the new path.
- **REQ-006**: No rendering behavior, spacing, or styling shall change.
- **GUD-001**: Follow the existing layout file conventions in `src/layouts/` (default-export single-file component, `<script setup lang="ts">`).

## 4. Interfaces & Data Contracts

The public interface of `AppCard` is unchanged; only its location changes.

### File relocation

| From                                       | To                                            |
| ------------------------------------------ | --------------------------------------------- |
| `src/components/molecules/AppCard.vue`     | `src/layouts/AppCardLayout.vue`               |
| `src/components/__tests__/AppCard.test.ts` | `src/layouts/__tests__/AppCardLayout.test.ts` |

### Props (unchanged)

```ts
interface AppCardLayoutProps {
  title?: string;
  width?: string;
  pageClass?: string;
  bodyClass?: string;
  error?: string;
  success?: string;
  titleClass?: string; // default: 'text-center q-my-none'
}
```

### Import path change (all consumers)

```ts
// before
import AppCard from '@/components/molecules/AppCard.vue';
// after
import AppCardLayout from '@/layouts/AppCardLayout.vue';
```

Consumers that keep the local tag `AppCard` simply update the import binding, e.g.:

```ts
import AppCard from '@/layouts/AppCardLayout.vue';
```

## 5. Acceptance Criteria

- **AC-001**: `src/layouts/AppCardLayout.vue` exists and `src/components/molecules/AppCard.vue` no longer exists.
- **AC-002**: Given any page or test that previously imported `@/components/molecules/AppCard.vue`, When the app runs, Then it resolves from `@/layouts/AppCardLayout.vue` and renders identically.
- **AC-003**: Given the relocated component, When mounted with `title`, `error`, `success`, `pageClass`, `bodyClass`, or `titleClass`, Then all props behave exactly as before.
- **AC-004**: Given `src/layouts/__tests__/AppCardLayout.test.ts`, When run, Then the four original `AppCard` assertions (title, error chip, success chip, notifications-between-header-and-body) pass.
- **AC-005**: Given the `docs/pages.md` component tree, When the move is complete, Then `AppCard` is removed from `molecules` and `AppCardLayout` is listed under `layouts/`.
- **AC-006**: Given the full test suite, When run, Then all existing page/auth/create tests that stub `AppCard` pass with only the import path updated.

## 6. Test Automation Strategy

- **Test Levels**: Unit (component) tests; page tests are regression checks.
- **Frameworks**: Vitest + `@vue/test-utils` (`shallowMount`), consistent with the current `AppCard.test.ts`.
- **Actions**:
  - Move `AppCard.test.ts` to `src/layouts/__tests__/AppCardLayout.test.ts`, updating the import path to `../../AppCardLayout.vue`.
  - Verify page tests (LoginPage, SignupPage, OnboardingPage, SettingsPage, CreatePages) still pass after their imports point to the layout.
- **CI/CD Integration**: run via `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip` in the pre-push pipeline.

## 7. Rationale & Context

`AppCard` wraps `q-page` and owns page-level centering and spacing — the defining trait of a Template/layout component. It sits alongside `AppDetailLayout` and `AppListLayout`, which are already in `src/layouts/`, but `AppCard` was placed in `molecules/` during earlier consolidation (spec-059). With the introduction of an inline content card (`AppPanelCard`, spec-073), keeping a page-shell named `AppCard` in `molecules/cards` would create ambiguity between a full-page shell and an inline card. Renaming to `AppCardLayout` and moving to `src/layouts/` makes the distinction explicit and matches the established convention.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: None. Frontend-only file relocation.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: None.

### Technology Platform Dependencies

- **PLT-001**: Vue 3 Composition API (`<script setup>`); Quasar `q-page`, `q-chip`.

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

### Import relocation in a consumer

```ts
// src/pages/matches/CreatePage.vue
import AppCard from '@/layouts/AppCardLayout.vue';
```

No change to the `<template>` usage; the tag `AppCard` continues to resolve because the import binding is unchanged.

### Test relocation

```ts
// src/layouts/__tests__/AppCardLayout.test.ts
import { shallowMount } from '@vue/test-utils';
// ...
const AppCard = (await import('../../AppCardLayout.vue')).default;
```

Edge cases:

- Any test stub that registers `AppCard` by string name (e.g. `AppCard: { template: ... }`) is unaffected, because Vue matches stubs by the component's `name`/local tag, not its file path. Verify no stub relies on the old file path.
- No page changes behavior; only import statements change.
- Ensure the old file is fully deleted so knip does not report a dangling export.

## 10. Validation Criteria

- `pnpm test` passes (including relocated `AppCardLayout.test.ts` and all page tests).
- `pnpm lint` and `pnpm typecheck` pass.
- `pnpm knip` reports no dead imports/exports (no lingering reference to `molecules/AppCard.vue`).
- `pnpm format:check` passes.

## 11. Related Specifications / Further Reading

- `spec-073-inline-card-molecule.md` — introduces the inline `AppPanelCard`; this move disambiguates the page-shell vs inline card
- `spec-059-appcard-refactor.md` — original `AppCard`/`AuthCard` consolidation that placed `AppCard` in molecules
- `docs/pages.md` — layout component tree (`layouts/ = Templates layer`)
