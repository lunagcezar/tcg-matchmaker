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

| Test File                                        | Page                                                                                                                                             | Tests |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| `pages/__tests__/LoginPage.test.ts`              | `auth/LoginPage.vue`                                                                                                                             | 2     |
| `pages/__tests__/SignupPage.test.ts`             | `auth/SignupPage.vue`                                                                                                                            | 2     |
| `pages/__tests__/MatchListPage.test.ts`          | `matches/ListPage.vue`                                                                                                                           | 2     |
| `pages/__tests__/MatchDetailPage.test.ts`        | `matches/DetailPage.vue`                                                                                                                         | 2     |
| `pages/__tests__/IndexPage.test.ts`              | `IndexPage.vue`                                                                                                                                  | 2     |
| `pages/__tests__/SettingsPage.test.ts`           | `SettingsPage.vue`                                                                                                                               | 1     |
| `pages/__tests__/ProfilePage.test.ts`            | `ProfilePage.vue`                                                                                                                                | 1     |
| `pages/__tests__/TradingPages.test.ts`           | `trading/ListPage.vue`                                                                                                                           | 1     |
| `pages/__tests__/StoresTournamentsPages.test.ts` | `tournaments/ListPage.vue`, `stores/ListPage.vue`                                                                                                | 2     |
| `pages/__tests__/RemainingDetailPages.test.ts`   | `trading/DetailPage.vue`, `tournaments/DetailPage.vue`, `stores/DetailPage.vue`, `stores/SettingsPage.vue`, `notifications/NotificationPage.vue` | 5     |
| `pages/__tests__/AdminPages.test.ts`             | 7 admin pages (dashboard, TCG, users, stores, audit, reports, formats)                                                                           | 7     |

### Test Patterns

- Mock Pinia stores (`useAuthStore`, `useEventStore`, `useStoreStore`) with `vi.mock` + `vi.hoisted`
- Mock composables (`usePageMeta`) with `vi.mock`
- Mock `vue-router` (`useRoute`, `useRouter`), `quasar` (`useQuasar`), and `localStorage` for component deps
- Stub Quasar components (`q-page`, `q-card`, `q-btn`, etc.) with `shallowMount`
- Test render existence and action invocations (signIn, signUp, list, get, join)

## 3. Acceptance Criteria

- **AC-001**: 34 page tests covering all 31 pages
- **AC-002**: All 133 tests pass (64 worker + 69 frontend)
- **AC-003**: Every page in the project (auth, list, detail, create, manage, admin, error) has at least one render test
