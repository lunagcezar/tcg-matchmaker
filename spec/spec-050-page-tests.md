---
title: Page Test Coverage
version: 1.0
date_created: 2026-07-15
tags: frontend, tests
---

# Page Test Coverage

## 1. Purpose & Scope

Add Vitest unit tests for frontend pages. 31 pages had zero tests. This spec adds tests for the most critical pages — auth flows (login, signup) and data display (match list).

## 2. Test Files Added

| Test File                               | Page                   | Tests |
| --------------------------------------- | ---------------------- | ----- |
| `pages/__tests__/LoginPage.test.ts`     | `auth/LoginPage.vue`   | 2     |
| `pages/__tests__/SignupPage.test.ts`    | `auth/SignupPage.vue`  | 2     |
| `pages/__tests__/MatchListPage.test.ts` | `matches/ListPage.vue` | 2     |

### Test Patterns

- Mock Pinia stores (`useAuthStore`, `useEventStore`) with `vi.mock` + `vi.hoisted`
- Mock composables (`usePageMeta`) with `vi.mock`
- Stub Quasar components (`q-page`, `q-card`, `q-btn`, etc.) with `shallowMount`
- Test render existence and action invocations (signIn, signUp, list)

## 3. Acceptance Criteria

- **AC-001**: LoginPage renders and calls signIn on login
- **AC-002**: SignupPage renders and calls signUp on registration
- **AC-003**: MatchListPage renders and calls store.list with correct params
- **AC-004**: All 105 tests pass (64 worker + 41 frontend)
