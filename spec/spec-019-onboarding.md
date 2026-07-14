---
title: Onboarding Page & Auth Components
version: 1.0
date_created: 2026-07-14
tags: frontend, auth, onboarding, components, tdd
---

# Introduction

This specification implements the onboarding flow (first admin setup) and extracts reusable atom/molecule components from the existing auth pages.

## 1. Purpose & Scope

**Purpose:** Implement the first-run onboarding page that creates the initial admin, and componentize the auth form pattern into reusable molecules.

**Scope:**

- `AppCard` atom — reusable card wrapper with consistent styling
- `AuthForm` molecule — email/password/username/displayName form with submit handler
- Onboarding page using `AuthForm` with admin creation flow
- Refactor Login/Signup pages to use `AuthForm`

## 2. Pages & Components

| Component        | Type     | Purpose                                    |
| ---------------- | -------- | ------------------------------------------ |
| `AppCard`        | Atom     | Consistent card wrapper with title slot    |
| `AuthForm`       | Molecule | Reusable auth form with field slots        |
| `OnboardingPage` | Page     | First admin creation with check and submit |

## 3. Acceptance Criteria

- **AC-001**: Onboarding page shows form when no admin exists.
- **AC-002**: Form submits to POST /api/auth/onboarding.
- **AC-003**: AppCard renders with title and content slots.
- **AC-004**: AuthForm renders with configurable fields.
- **AC-005**: Login and Signup pages still render correctly.
