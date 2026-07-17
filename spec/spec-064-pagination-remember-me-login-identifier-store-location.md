---
title: Pagination, Remember Me, Login Identifier, Store Location Autocomplete
version: 1.0
date_created: 2026-07-16
tags: frontend, worker, ux, auth
---

# Introduction

Four UX improvements: store create page gets location autocomplete, login gets a "remember me" checkbox and accepts email or username, and store list gets infinite scroll pagination.

## 1. Purpose & Scope

- Replace raw lat/lng/city/state fields on store create with the existing LocationAutocomplete component.
- Add cursor-based pagination to the stores list endpoint and wire up `q-infinite-scroll` on the frontend.
- Fix sessions expiring on page reload by adding a "remember me" checkbox that controls session persistence.
- Allow users to log in with either email or username instead of email-only.

## 2. Definitions

- **Identifier**: Either an email address or a username string used to identify the user at login.
- **Remember Me**: A user preference flag stored in localStorage. When `false`, `restoreSession` signs out on page reload.
- **Cursor-based pagination**: Pagination using an opaque cursor (base64url-encoded JSON) rather than offset/limit.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Store create page shall use `LocationAutocomplete` for geocoding and auto-fill city/state/lat/lng.
- **REQ-002**: Worker `GET /api/stores` shall support `limit` (default 50, max 100) and `cursor` query parameters.
- **REQ-003**: Worker `GET /api/stores` shall return `meta.next_cursor` and `meta.has_more` for pagination.
- **REQ-004**: Store list page shall load more items via `q-infinite-scroll` as the user scrolls.
- **REQ-005**: Login shall display a single "Email or Username" input field instead of separate email and username fields.
- **REQ-006**: Worker shall provide `GET /api/auth/resolve/:identifier` to look up a user's email by email or username.
- **REQ-007**: Login flow shall resolve an identifier (email or username) to an email before calling Supabase signInWithPassword.
- **REQ-008**: A "Remember me" checkbox shall appear on the login form, defaulting to checked.
- **REQ-009**: When "Remember me" is unchecked, `restoreSession` shall sign out on subsequent page loads (session not persisted across reloads).
- **REQ-010**: Worker geocoding `GET /api/geocode/search` shall include `addressdetails=1` in the Nominatim URL so structured address data is returned.
- **REQ-011**: `LocationAutocomplete` shall emit `city`, `state`, `country` alongside lat/lng/displayName.
- **CON-001**: All Supabase Auth calls go through the publishable key from the frontend; Worker uses the secret key for DB lookups.
- **CON-002**: No `Buffer` usage in Workers — use `btoa`/`atob` with manual base64url encoding.
- **CON-003**: Store search filter is client-side only (filters already-loaded items).

## 4. Interfaces & Data Contracts

### Worker: `GET /api/auth/resolve/:identifier`

Response:

```json
{
  "data": { "email": "user@example.com", "username": "player1" },
  "error": null,
  "meta": null
}
```

404 when not found.

### Worker: `GET /api/stores?limit=20&cursor=<base64url>`

Response:

```json
{
  "data": [{ "id": "...", "name": "Game Store", ... }],
  "error": null,
  "meta": { "next_cursor": "<base64url>", "has_more": true }
}
```

Cursor is a base64url-encoded JSON object `{ name: string; id: string }`.

### i18n additions

| Key                    | EN                | PT-BR            |
| ---------------------- | ----------------- | ---------------- |
| `auth.emailOrUsername` | Email or Username | Email ou Usuário |
| `auth.rememberMe`      | Remember me       | Lembrar de mim   |
| `store.searchLocation` | Search location   | Buscar local     |

## 5. Acceptance Criteria

- **AC-001**: Given a user on the store create page, when they search for a location in LocationAutocomplete and select a result, then lat/lng/city/state are auto-filled.
- **AC-002**: Given the stores list page, when the user scrolls to the bottom, more stores load (cursor request). When no more stores exist, loading stops.
- **AC-003**: Given the login page, when the user enters a username (without @) and a password and submits, then the Worker resolves the username to an email and the user is signed in.
- **AC-004**: Given the login page, when the user unchecks "Remember me" and logs in, then after a page reload the user is signed out.
- **AC-005**: Given the login page, when the user checks "Remember me" and logs in, then after a page reload the session is restored.

## 6. Test Automation Strategy

- Worker tests cover the new store pagination (mock Supabase chain resolves at `limit`).
- Worker tests cover the existing auth routes (unmodified).
- LoginPage tests updated to reflect new `handleLogin({ identifier, password })` signature and `resolveIdentifier` mock.
- All existing tests pass (183 total).

## 7. Rationale & Context

Cursor-based pagination was chosen over offset pagination for the stores list to avoid duplicate/skip issues when stores are inserted mid-scroll. The "remember me" flag approach (localStorage boolean) was chosen because it's simple and doesn't require backend changes — it just controls whether `restoreSession` honors the persisted Supabase session. Login-by-username is handled by a Worker endpoint that looks up the email from the `users` table, keeping Supabase Auth's email-based signIn unchanged.

## 8. Dependencies & External Integrations

- **Nominatim**: Geocoding provider; the `addressdetails=1` parameter requests structured address data.
- **Supabase Auth**: Used for `signInWithPassword` (email/password only); username resolution happens via Worker DB query.

## 9. Examples & Edge Cases

- **Identifier resolution**: If the user types `player1` (no @), `GET /api/auth/resolve/player1` returns `{ email: "player1@example.com" }`. If the user types `user@example.com`, the resolver returns it directly (no API call).
- **Cursor encoding**: `{ name: "Game Store", id: "uuid" }` → `btoa(JSON.stringify(...))` → replace `+/=` with `-_` empty → base64url string.
- **Remember me**: On fresh login with remember me unchecked, `localStorage.setItem('tcg_remember_me', 'false')` is set. On next page load, `restoreSession` checks the flag and signs out via `supabase.auth.signOut()`.

## 10. Validation Criteria

1. All tests pass: `pnpm test` returns 0 exit code.
2. Lint passes: `pnpm lint` returns 0 errors.
3. TypeScript compiles: `vue-tsc --noEmit` in frontend, `tsc --noEmit` in worker.

## 11. Related Specifications / Further Reading

- `spec/spec-010-geocoding-api.md`
- `spec/spec-006-game-stores-api.md`
- `spec/spec-002-auth-system.md`
