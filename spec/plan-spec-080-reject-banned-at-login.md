# Plan — spec-080 Reject Banned Accounts (login + active sessions)

Maps spec requirements to concrete tasks. TDD: tests first (RED), then implementation (GREEN).

## Technical Decisions

| #   | Decision                                                                                                                                                                                                                 | Spec req              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| D1  | Account-level message constants live in `src/lib/authMessages.ts` (`ACCOUNT_BANNED_MESSAGE`, `ACCOUNT_DELETED_MESSAGE`); `useApi` needs them and importing from the store would create a cycle (`useAuthStore → useApi`) | REQ-004               |
| D2  | `useApi.ts` gains `parseResponse` + module-level `onSessionRejected` + `setSessionRejectedHandler`; default null (no-op in tests/SSR)                                                                                    | REQ-005, REQ-006      |
| D3  | `useAuthStore.fetchProfile` returns `{ data, error }`; `signIn` rejects account-level rejections; new `handleRejectedSession()` action                                                                                   | REQ-001..003, REQ-008 |
| D4  | `boot/auth.ts` registers the handler → `handleRejectedSession()` + `router.push('/login?reason=…')`                                                                                                                      | REQ-007               |
| D5  | `LoginPage` maps thrown error and `?reason=` query to `auth.banned`/`auth.deleted`, clears the param                                                                                                                     | REQ-009, REQ-010      |
| D6  | `restoreSession` behavior unchanged (signs out when profile null) — guarded by regression test                                                                                                                           | REQ-010/AC-006        |
| D7  | Test seams: store → `vi.mock('@/lib/supabase')` + fetch stub; useApi → fetch stub + handler; page → mocked store + i18n messages                                                                                         | GUD-002               |

## Task List

### T1 — `src/lib/authMessages.ts`

- Add `ACCOUNT_BANNED_MESSAGE = 'Account is banned'` and `ACCOUNT_DELETED_MESSAGE = 'Account not found'`.

### T2 — `useApi.test.ts` (RED) → `useApi.ts` (GREEN)

- RED: handler invoked on banned/deleted responses; not invoked for `'Store not found'`; no-op when unregistered; envelope still returned.
- GREEN: `parseResponse` + `setSessionRejectedHandler`.

### T3 — `useAuthStore.test.ts` (RED) → `useAuthStore.ts` (GREEN)

- RED: AC-001 banned signIn (reject + signOut + null state); AC-003 deleted; AC-004 valid; AC-005 network-blip; AC-006 restore signs out banned; `handleRejectedSession`.
- GREEN: `fetchProfile` envelope, `signIn` rejection, `handleRejectedSession`, re-export constants from `lib/authMessages.ts`.

### T4 — `LoginPage.test.ts` (RED) → `LoginPage.vue` (GREEN)

- RED: AC-002 thrown ban → `$t('auth.banned')`; AC-009 `?reason=banned` on mount → message + param cleared.
- GREEN: `useI18n` + mapping in catch + `onMounted` reason handling.

### T5 — i18n keys

- `auth.banned` / `auth.deleted` in `en-US` + `pt-BR`.

### T6 — `boot/auth.ts`

- Register the session-rejection handler (sign out + redirect with reason) before `restoreSession`.

### T7 — Verification & docs

- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check`.
- Update `CHANGELOG.md`.
- Commit: `fix(frontend): reject banned accounts at login and during active sessions (spec-080)`.
