---
title: Settings Page
version: 1.0
date_created: 2026-07-15
tags: frontend, settings
---

# Settings Page

## 1. Purpose & Scope

Implement a basic settings page at `/settings` (auth-protected) where users can edit their display name, switch language, toggle dark mode, and sign out. This is the initial settings page — account management features (delete, suspend, export) are added in spec-041.

## 2. Definitions

| Term         | Definition                                               |
| ------------ | -------------------------------------------------------- |
| Display name | User-facing name shown in the UI, changeable at any time |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Route `/settings` requires authentication (redirects to `/login` if not authenticated)
- **REQ-002**: Page loads the current user's profile data (display_name) on mount
- **REQ-003**: User can edit display_name and save via `PATCH /api/auth/profile`
- **REQ-004**: Language selector with English and Portuguese options; changes locale via i18n
- **REQ-005**: Dark mode toggle; changes theme via useAppStore
- **REQ-006**: Sign out button that clears session and redirects to `/login`
- **REQ-007**: Show success/error feedback after saving profile
- **REQ-008**: SEO meta tags set for the settings page
- **CON-001**: Language selection uses Quasar's QSelect with emit-value and map-options

## 4. Acceptance Criteria

- **AC-001**: Given an authenticated user, When they navigate to `/settings`, Then the settings form is displayed with their current display_name, language, and dark mode preference
- **AC-002**: Given a user edits their display name and clicks save, When the API responds, Then a success message is shown
- **AC-003**: Given a user selects a different language, When the dropdown changes, Then the UI language switches
- **AC-004**: Given a user toggles dark mode, When the toggle is clicked, Then the theme switches
- **AC-005**: Given a user clicks sign out, When the action completes, Then they are redirected to `/login`
- **AC-006**: Given an unauthenticated visitor, When they navigate to `/settings`, Then they are redirected to `/login`

## 5. Dependencies

- Backend `GET /api/auth/me` and `PATCH /api/auth/profile`
- `useAuthStore` for session
- `useAppStore` for theme/locale preferences
- `usePageMeta` for SEO tags
