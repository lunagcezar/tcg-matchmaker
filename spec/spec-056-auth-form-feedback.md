---
title: Auth Form Feedback — Error/Success Messages on Sign In, Sign Up, Onboarding
version: 1.0
date_created: 2026-07-15
tags: frontend, auth, ux
---

## 1. Purpose & Scope

Add user-visible feedback (inline error and success messages) to the sign in, sign up, and onboarding forms so users know what happened after submission.

## 2. Changes

### LoginPage

- Added `loading` ref passed to AuthForm (button shows spinner during submission)
- Added `error` ref displayed as a text-negative banner above the form
- Added `try/catch` in `handleLogin` to capture and display errors from `authStore.signIn()`

### SignupPage

- Added `error` ref displayed as a text-negative banner above the form
- Changed `try/finally` to `try/catch/finally` to capture and display errors from `authStore.signUp()`
- Added success message before redirect to `/login`

### OnboardingPage

- Added `success` ref displayed as a text-positive banner above the form
- Set success message and delayed redirect (1.5s) after successful admin creation

### Tests

- LoginPage: error display on failure, error cleared on re-submit
- SignupPage: error display on failure, error cleared on re-submit
- OnboardingPage: error display on API error, success message on creation

## 3. Acceptance Criteria

- **AC-001**: Login form shows an inline error message when sign-in fails (e.g., invalid credentials).
- **AC-002**: Login form shows a loading spinner on the submit button during sign-in.
- **AC-003**: Signup form shows an inline error message when sign-up fails.
- **AC-004**: Signup form shows a success message and redirects to `/login` on success.
- **AC-005**: Onboarding form shows an inline error message when the API returns an error.
- **AC-006**: Onboarding form shows a success message and redirects to `/login` on success.
- **AC-007**: Error messages are cleared before each new submission.
