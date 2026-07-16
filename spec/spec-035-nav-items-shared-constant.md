---
title: Nav Items as Shared Constant
version: 1.0
date_created: 2026-07-15
tags: frontend, navigation, refactoring
---

# Nav Items as Shared Constant

## 1. Purpose & Scope

Extract navigation item definitions into a shared constant array (`src/router/navItems.ts`) so that both MainLayout and AdminLayout (and any future components) can import the same nav items. This eliminates duplication and ensures a single source of truth for navigation structure.

## 2. Definitions

| Term    | Definition                                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------------------- |
| NavItem | Interface defining a navigation entry with label key, route path, icon, auth requirement, and exact-match flag |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Define a `NavItem` interface in `src/router/navItems.ts` with fields: `labelKey`, `to`, `icon`, `auth`, `divider`, `exact`
- **REQ-002**: Export two constants: `navItems` (matches, trading, tournaments, stores) and `drawerNavItems` (home, stores, divider, events, settings)
- **REQ-003**: `eventNavItems` is a reusable subset used by both header and drawer
- **REQ-004**: Use the `as const` pattern for type-safe readonly arrays
- **REQ-005**: MainLayout imports `navItems` from the shared file
- **REQ-006**: Auth-guarded items use `auth: true` to conditionally render in the drawer
- **CON-001**: All items use i18n `labelKey` (not hardcoded labels) for localization
- **CON-002**: The divider item has no label/route and renders a `<q-separator>`

## 4. Interfaces

```ts
interface NavItem {
  labelKey?: string;
  to?: string;
  icon?: string;
  auth?: boolean;
  divider?: boolean;
  exact?: boolean;
}
```

## 5. Acceptance Criteria

- **AC-001**: Given the app renders the header, When inspecting the nav buttons, Then they match the routes and labels defined in `headerNavItems`
- **AC-002**: Given the app renders the drawer, When inspecting the nav items, Then they match `drawerNavItems` including auth-guarded items
- **AC-003**: Given a new nav item is added to `navItems.ts`, When the app renders, Then it appears in both header and drawer as appropriate
- **AC-004**: Given the user is not authenticated, When the drawer renders, Then auth-guarded items are hidden

## 6. Dependencies

- MainLayout imports from `src/router/navItems.ts`
- i18n translation keys for nav labels
