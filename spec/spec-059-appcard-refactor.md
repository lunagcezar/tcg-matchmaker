---
title: AppCard Refactor — Move to Molecules, Merge AuthCard, Unify Page Patterns
version: 1.0
date_created: 2026-07-15
tags: frontend, refactor
---

## 1. Purpose & Scope

Refactor AppCard from atom to molecule, merge AuthCard functionality into it, and unify the common card-centered page pattern (`q-page` + `q-card` + title) used across auth pages, settings pages, and create pages.

## 2. Changes

### AppCard (`src/components/molecules/AppCard.vue`)

- Wraps `<q-page>` internally with a configurable `pageClass` prop (replacing the per-page `q-page` boilerplate).
- Accepts `bodyClass` prop to set classes on the inner `<q-card-section>` (e.g. `q-gutter-sm`).
- Accepts `error` and `success` string props to render inline banners (merged from AuthCard).
- `align="center"` on `q-card-actions` for centered action buttons.

### AuthCard (removed)

- Merged into AppCard. The `error`/`success` props and default `page-class="row items-center justify-center"` pattern are now on AppCard itself.

### Pages updated

- LoginPage, SignupPage, OnboardingPage: use `<AppCard>` directly with `page-class="row items-center justify-center"`.
- SettingsPage: uses `<AppCard>` with `page-class="q-pa-md flex flex-center"` and `body-class="q-gutter-sm"`.

## 3. Files Changed

| File                                    | Change                                      |
| --------------------------------------- | ------------------------------------------- |
| `src/components/atoms/AppCard.vue`      | Deleted (moved to molecules)                |
| `src/components/molecules/AppCard.vue`  | Added with q-page, error/success, bodyClass |
| `src/components/molecules/AuthCard.vue` | Deleted                                     |
| `src/pages/auth/LoginPage.vue`          | Use AppCard directly                        |
| `src/pages/auth/SignupPage.vue`         | Use AppCard directly                        |
| `src/pages/auth/OnboardingPage.vue`     | Use AppCard directly                        |
| `src/pages/SettingsPage.vue`            | Convert to AppCard with bodyClass           |
| Test files                              | Fix assertions to check `vm.error` directly |

## 4. Acceptance Criteria

- **AC-001**: Auth pages render identically with AppCard replacing AuthCard.
- **AC-002**: SettingsPage renders identically with AppCard replacing native `<q-card>`.
- **AC-003**: All 86 frontend tests pass.
