---
title: Auth Form Validation Fixes & Login/Onboarding Adjustments
version: 1.0
date_created: 2026-07-15
tags: frontend, auth, worker, validation
---

## 1. Purpose & Scope

Fix three regressions in auth forms and user schema: confirm password showing on login, Zod parsing error on onboarding POST response, and ensure login works once a user exists.

## 2. Changes

### AuthForm — confirmPassword only on signup/onboarding

- `AuthForm.vue`: changed `confirmPassword` field visibility from `showField('password')` to `showField('confirmPassword')`, so it only renders when explicitly listed in the `fields` prop.
- `SignupPage.vue`: added `'confirmPassword'` to its fields array.
- `OnboardingPage.vue`: added `'confirmPassword'` to its fields array.
- `LoginPage.vue`: unchanged (default fields `['email', 'password']`) — no confirm password.

### UserSchema / UserResponseSchema — relaxed date validation

- Changed `z.string().datetime()` to `z.string()` for `created_at`, `banned_at`, and `suspended_at` fields. Supabase returns timestamps as ISO strings, but strict Zod datetime validation can fail on edge cases (format differences, null-coercion). The database already guarantees valid timestamps.

## 3. Acceptance Criteria

- **AC-001**: Login form shows only email and password fields (no confirm password).
- **AC-002**: Signup form shows email, username, display name, password, and confirm password.
- **AC-003**: Onboarding form shows the same fields as signup.
- **AC-004**: `POST /api/auth/onboarding` returns 200 with user data on success (no ZodError).
- **AC-005**: A successfully onboarded admin can log in via `POST /api/auth/signin`.
