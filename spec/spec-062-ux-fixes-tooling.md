---
title: UX Fixes, Tooling & Bug Squashes
version: 1.0
date_created: 2026-07-16
tags: bugfix, ux, tooling
---

# Introduction

Fix several regressions and tooling issues: vue-tsc type errors, missing Quasar Dialog plugin, unregistered auth boot file, username uniqueness validation, stale session after DB reset, readonly username field, and non-functional account operation buttons.

## 1. Purpose & Scope

**Purpose**: Resolve six user-reported bugs and two tooling errors.

**Scope**: Frontend (Quasar config, settings page, auth store, profile page, user menu), Worker (auth route), CHANGELOG update.

## 2. Definitions

| Term            | Definition                                                                     |
| --------------- | ------------------------------------------------------------------------------ |
| Quasar Dialog   | Quasar plugin for modal dialogs (`$q.dialog()`)                                |
| Boot file       | Quasar app initialization file run before app mount                            |
| Session restore | Process of rehydrating Supabase auth session from localStorage on page refresh |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Fix `vue-tsc --noEmit` errors. ProfilePage.vue must compile.
- **REQ-002**: Register `auth` boot file in `quasar.config.ts` so session restore runs before route guards.
- **REQ-003**: Add `Dialog` to Quasar plugins in `quasar.config.ts` so `$q.dialog()` works in SettingsPage.
- **REQ-004**: Remove `readonly` from username input in SettingsPage so users can edit their username.
- **REQ-005**: Worker `PATCH /profile` must reject duplicate usernames (case-insensitive uniqueness).
- **REQ-006**: `restoreSession` in useAuthStore must clear the user and sign out if `fetchProfile` returns null (handles stale session after DB reset).
- **REQ-007**: Username must be editable and saved via PATCH /profile.
- **REQ-008**: Account operation buttons (download, suspend, delete) must trigger confirmation dialogs.
- **CON-001**: No regressions — all existing tests must pass.
- **PAT-001**: Follow existing test patterns (Vitest, @vue/test-utils, hono test helpers).

## 4. Interfaces & Data Contracts

### Worker PATCH /profile (modified)

Add username uniqueness check before update:

```ts
// Before update, check if another user already has this username
const { data: existing } = await supabase
  .from('users')
  .select('id')
  .eq('username', parsed.data.username)
  .neq('id', user.id)
  .maybeSingle();

if (existing) {
  return c.json({ data: null, error: 'Username already taken', meta: null }, 409);
}
```

### useAuthStore.restoreSession (modified)

```ts
async function restoreSession() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) {
    user.value = data.session.user;
    await fetchProfile();
    if (!profile.value) {
      await supabase.auth.signOut();
      user.value = null;
    }
  }
}
```

### quasar.config.ts changes

```ts
boot: ['i18n', 'supabase', 'auth', 'sentry'],  // added 'auth'
// ...
plugins: ['Dark', 'Dialog'],  // added 'Dialog'
```

## 5. Acceptance Criteria

- **AC-001**: `pnpm typecheck` (vue-tsc) passes with 0 errors in the frontend package.
- **AC-002**: After DB reset and page refresh, the user is logged out instead of showing a broken auth state.
- **AC-003**: Clicking Download/Suspend/Delete in Settings → Account tab shows a confirmation dialog.
- **AC-004**: Username input in Settings → Profile tab is editable and can be saved.
- **AC-005**: Setting a duplicate username returns an error and does not update the profile.
- **AC-006**: All existing tests pass (70 worker + 112 frontend = 182 tests).

## 6. Test Automation Strategy

- **Unit tests**: Update SettingsPage test to verify dialog buttons fire.
- **Worker tests**: Add test for duplicate username rejection in PATCH /profile.
- **Auth store tests**: Add test for restoreSession clearing user when profile fetch fails.
- **Command**: `pnpm test` must pass (all packages).
- **Command**: `pnpm typecheck` must pass (frontend).

## 7. Rationale & Context

- The `auth` boot file was created in spec-061 but never registered, so session restore was silently skipped.
- The `Dialog` plugin was never installed, making `$q.dialog()` a no-op without any error feedback.
- The username uniqueness issue could cause naming conflicts if two users pick the same name.
- Stale sessions after DB reset left the app in a half-logged-in state with no profile data.

## 8. Dependencies & External Integrations

- **PLT-001**: Quasar Dialog plugin — required for confirmation dialogs in destructive account operations.

## 9. Examples & Edge Cases

- **Edge case**: User resets local Supabase database (or it's wiped). Old JWT is still valid in Supabase Auth but user row is gone. `restoreSession` must detect this and sign out.
- **Edge case**: User attempts to change username to a taken username. Worker returns 409 Conflict.
- **Edge case**: Username uniqueness must be case-insensitive (prevent "Alice" and "alice" as distinct users).

## 10. Validation Criteria

- `pnpm typecheck` passes in packages/frontend
- `pnpm lint` passes (only pre-existing warnings)
- `pnpm test` passes (all packages)
- New tests cover: username uniqueness (worker), dialog rendering (settings page), session clearing on restore failure (optional)

## 11. Related Specifications / Further Reading

- spec-061: UX fixes and regression improvements (introduced the auth boot file)
