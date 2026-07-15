---
title: Navbar Components (ThemeLangSwitcher, UserMenu)
version: 1.0
date_created: 2026-07-15
tags: frontend, navbar, components
---

# Navbar Components

## 1. Purpose & Scope

Extract reusable navbar components from MainLayout: `ThemeLangSwitcher` (dark mode toggle + language selector) and `UserMenu` (user avatar dropdown with settings + logout). These components are placed in `components/molecules/` following atomic design.

## 2. Definitions

| Term              | Definition                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------- |
| ThemeLangSwitcher | Molecule component containing the dark mode toggle button and language dropdown              |
| UserMenu          | Molecule component showing user avatar + display name dropdown with settings link and logout |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: ThemeLangSwitcher contains a dark mode icon toggle and a language QBtnDropdown with English/Português options
- **REQ-002**: Dark mode icon shows `light_mode` in dark mode and `dark_mode` in light mode, with tooltip
- **REQ-003**: Language dropdown shows the current language label as the trigger text
- **REQ-004**: ThemeLangSwitcher uses `useAppStore` for both dark mode and locale
- **REQ-005**: UserMenu shows user avatar (initial letter) + display name when authenticated
- **REQ-006**: UserMenu dropdown contains "Settings" (link to `/settings`) and "Logout" (calls signOut)
- **REQ-007**: UserMenu shows Login/Signup buttons when unauthenticated
- **REQ-008**: Both components are imported in MainLayout alongside header nav items
- **CON-001**: All user-facing strings use `$t()` for i18n
- **CON-002**: Components follow Quasar conventions (QBtnDropdown, QAvatar, QList, QItem)

## 4. Acceptance Criteria

- **AC-001**: Given the navbar renders, When the user clicks the dark mode toggle, Then the theme switches and the icon toggles
- **AC-002**: Given the navbar renders, When the user opens the language dropdown and selects a language, Then the UI locale changes
- **AC-003**: Given the user is authenticated, When the navbar renders, Then the user avatar and display name are shown
- **AC-004**: Given the user opens the UserMenu dropdown, When they click "Settings", Then they navigate to `/settings`
- **AC-005**: Given the user opens the UserMenu dropdown, When they click "Logout", Then they are logged out and redirected to login
- **AC-006**: Given the user is unauthenticated, When the navbar renders, Then Login/Signup buttons are shown instead of UserMenu

## 5. Dependencies

- `useAppStore` for theme/locale state
- `useAuthStore` for user session
- `vue-router` for navigation
