---
title: UX Fixes and Regression Improvements
version: 1.0
date_created: 2026-07-16
tags: design, frontend, worker, schema
---

# Introduction

Fix multiple UX issues and regressions identified across the frontend application, including notification feedback, component styling, session persistence, navigation display, and schema simplification.

## 1. Purpose & Scope

This spec addresses the following issues observed in the TCG Matchmaker frontend:

1. **Signup notification**: No feedback is shown when an account is successfully created
2. **AppCard styling**: Error/success messages use plain `<p>` tags instead of Quasar Chip components; notifications should appear below the title
3. **Settings session refresh**: Refreshing on `/settings` redirects to `/login` because `restoreSession()` runs after route guards
4. **Settings tabs**: The Settings page needs tabs for Profile, Password, and Account sections
5. **Locale persistence**: Language preference is lost on page refresh because `boot/i18n.ts` hardcodes `locale: 'en-US'`
6. **Display name redundancy**: `display_name` column is redundant with `username`; remove it
7. **UserMenu display**: Shows first part of email instead of username
8. **Admin sidebar visibility**: Admin links don't show in the sidebar on page refresh

## 2. Definitions

| Term            | Definition                                                             |
| --------------- | ---------------------------------------------------------------------- |
| QChip           | Quasar component for displaying chips/tags with icons and colors       |
| QTabs           | Quasar tab navigation component for switching between panels           |
| Boot file       | Quasar file that runs before the app mounts, used for initialization   |
| Session restore | Process of checking Supabase for an existing auth session on page load |

## 3. Requirements

- **REQ-001**: Signup must show a success notification before redirecting to login
- **REQ-002**: AppCard must render error/success messages as QChip components
- **REQ-003**: Error/success messages in AppCard must be positioned below the title
- **REQ-004**: Refreshing `/settings` must keep the user on the settings page (not redirect to login)
- **REQ-005**: Settings page must have tabs: Profile, Password, Account
- **REQ-006**: Language selection must persist across page refreshes
- **REQ-007**: `display_name` column must be removed from the `users` table
- **REQ-008**: All schemas and code referencing `display_name` must be updated
- **REQ-009**: UserMenu must display `username` (not email) as the display name
- **REQ-010**: Admin navigation links must appear in the sidebar on page refresh for admin users

## 4. Interfaces & Data Contracts

### Updated SignupSchema (display_name removed)

```typescript
export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
});
```

### Updated UserSchema (display_name removed)

```typescript
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  role: z.enum(['player', 'organizer', 'admin']),
  avatar_path: z.string().nullable(),
  created_at: z.string(),
});
```

### Updated UserResponseSchema

```typescript
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  role: z.enum(['player', 'organizer', 'admin']),
  avatar_path: z.string().nullable(),
  banned_at: z.string().nullable(),
  suspended_at: z.string().nullable(),
  created_at: z.string(),
});
```

### Updated UserProfile type in useAuthStore

```typescript
export type UserProfile = {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'organizer' | 'admin';
  avatar_path: string | null;
  created_at: string;
};
```

### Migration SQL

```sql
ALTER TABLE public.users DROP COLUMN display_name;
```

## 5. Acceptance Criteria

- **AC-001**: After successful signup, a Quasar notification says "Account created!" and navigates to `/login`
- **AC-002**: AppCard renders error with `<q-chip icon="error" color="negative">` and success with `<q-chip icon="check_circle" color="positive">`
- **AC-003**: AppCard chips appear in the body section, below the title header
- **AC-004**: Navigating directly to `/settings` with a valid session does not redirect to `/login`
- **AC-005**: Settings page has three tabs labeled "Profile", "Password", and "Account"
- **AC-006**: Changing language and refreshing the page preserves the selected language
- **AC-007**: `display_name` column does not exist in `users` table after migration
- **AC-008**: No code references to `display_name` exist in the codebase (except migration files)
- **AC-009**: UserMenu shows `authStore.profile?.username` (or fallback to email prefix)
- **AC-010**: Admin users see the "Admin" section in the sidebar on page refresh

## 6. Test Automation Strategy

### Test Levels

- **Unit**: Component tests for AppCard, UserMenu, SignupPage, SettingsPage
- **Unit**: Store tests for useAuthStore (session restore)
- **Unit**: Composables tests for useNavTree (admin filtering)

### Test Cases to write/update

| Test                              | File                        | Description                                |
| --------------------------------- | --------------------------- | ------------------------------------------ |
| AppCard renders chip for error    | `AppCard.test.ts`           | Verify q-chip appears with error message   |
| AppCard renders chip for success  | `AppCard.test.ts`           | Verify q-chip appears with success message |
| SignupPage shows notification     | `SignupPage.test.ts`        | Verify $q.notify called on success         |
| SignupPage no displayName field   | `SignupPage.test.ts`        | Verify fields don't include displayName    |
| SettingsPage has tabs             | `SettingsPage.test.ts`      | Verify QTabs exist with 3 tab panels       |
| SettingsPage session restore      | `SettingsPage.test.ts`      | Verify auth store used for profile fetch   |
| UserMenu shows username           | `UserMenu.test.ts`          | Verify display shows username              |
| useNavTree shows admin for admins | `useNavTree.test.ts`        | Verify admin nodes present when role=admin |
| Locale persistence                | `i18n.test.ts` or boot test | Verify localStorage read during boot       |
| Auth store restoreSession         | `useAuthStore.test.ts`      | Verify session restored correctly          |

## 7. Rationale & Context

- **QChip over `<p>`**: QChip provides visually distinct, accessible notification badges that match Quasar's design system
- **Boot file for auth**: Moving `restoreSession()` to a boot file ensures session data is available before route guards fire, fixing refresh redirects
- **Boot file for i18n**: Reading locale from `localStorage` in the boot file ensures the i18n instance starts with the correct locale
- **Remove display_name**: Using only `username` eliminates redundancy, simplifies the schema, and reduces confusion. The UserMenu already falls back to username.
- **Settings tabs**: Organizing settings into Profile, Password, and Account sections follows common UX patterns and reduces scrolling

## 8. Dependencies

- **Schema migration**: Must be applied via Supabase CLI and dev database reset
- **Shared package rebuild**: Required after schema changes
- **Quasar QChip**: Built-in component, no additional dependency

## 9. Related Specifications

- spec-031-settings-page.md
- spec-032-navbar-components.md
- spec-041-settings-account-management.md
- spec-056-auth-form-feedback.md
- spec-059-appcard-refactor.md
