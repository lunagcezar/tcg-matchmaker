---
title: Fix Frontend Regressions (Sidebar, Navbar, Onboarding, Dark Mode)
version: 1.0
date_created: 2026-07-15
tags: frontend, ui, navigation, dark-mode, onboarding
---

## 1. Purpose & Scope

Fix several frontend regressions in the Quasar SPA: onboarding redirect, sidebar removal, navbar link improvements, stores link addition, and dark mode wiring.

## 2. Definitions

- **Onboarding**: First-run flow for creating the initial admin account when no users exist.
- **Sidebar/Drawer**: Left panel with navigation links on large screens.
- **Navbar/Header**: Top toolbar with app title and navigation links.

## 3. Requirements

- **REQ-001**: When no admin exists, all non-login/signup/onboarding routes must redirect to `/onboarding`.
- **REQ-002**: The left sidebar drawer must be removed.
- **REQ-003**: The navbar must include a Stores link pointing to `/stores`.
- **REQ-004**: The navbar must NOT include a Home link (the app title already links to `/`).
- **REQ-005**: Navbar link titles must be bold when the current route matches.
- **REQ-006**: Toggling dark mode in the UI must actually switch the app to dark mode (Quasar `Dark` plugin).

## 4. Files to Modify

| File                                 | Change                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `src/stores/useAuthStore.ts`         | Add cached `onboardingRequired` ref; update `checkOnboarding()` to cache result              |
| `src/router/index.ts`                | Add onboarding redirect check before auth guard                                              |
| `src/pages/auth/OnboardingPage.vue`  | Use cached `checkOnboarding` result                                                          |
| `src/layouts/MainLayout.vue`         | Remove drawer, remove home link, add stores link, add active-link bold logic, wire dark mode |
| `src/router/navItems.ts`             | Remove `drawerNavItems`, remove home from `headerNavItems`, add stores                       |
| `packages/frontend/quasar.config.ts` | Add `Dark` plugin to `framework.plugins`                                                     |

## 5. Acceptance Criteria

- **AC-001 (Onboarding redirect)**: Given an empty database with no users, When a user visits `/` or any protected route, Then they are redirected to `/onboarding`. Given a database with at least one admin, When any route is visited, Then no redirect to `/onboarding` occurs.
- **AC-002 (Sidebar removed)**: Given the MainLayout, When the page renders, Then no `q-drawer` is rendered and `drawerNavItems` is not imported.
- **AC-003 (Stores link)**: Given the navbar, When rendered, Then a Stores link exists pointing to `/stores`.
- **AC-004 (No Home link)**: Given the navbar, When rendered, Then there is no explicit Home link (the title link is the only `/` link).
- **AC-005 (Active bold)**: Given the navbar, When a nav link matches the current route, Then its text is bold.
- **AC-006 (Dark mode works)**: Given the app, When dark mode is toggled on, Then Quasar's `$q.dark.isActive` is `true` and the UI renders in dark mode.

## 6. Test Automation Strategy

- **Framework**: Vitest with `@vue/test-utils`
- **Tests**: Component tests for MainLayout verifying nav items rendering and dark mode watcher; unit tests for auth store onboarding caching; router guard test for onboarding redirect.

## 7. Dependencies

- Quasar `Dark` plugin must be registered in `framework.plugins`.
- `useQuasar()` composable from `quasar`.
- Existing `useAuthStore.checkOnboarding()` API endpoint.
