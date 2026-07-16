---
title: Major Visual Refactor — artemisluna.com.br-Inspired Layout
date_created: 2026-07-16
version: 1.0
tags: frontend, design, layout, ux
---

# Major Visual Refactor — artemisluna.com.br-Inspired Layout

## 1. Purpose & Scope

Redesign the TCG Matchmaker frontend to match the visual language of `artemisluna.com.br`: a calm, centered, content-first layout with a fixed top navbar, a sticky sidebar on large screens, limited page width, rounded media, and a purple-tinted neutral color palette. The refactor focuses on the shell (navbar, sidebar, layouts) and the home page; other feature pages are updated minimally to remove excessive card usage and adopt the new spacing, color, and type conventions.

**Scope:**

- New global CSS theme (colors, fonts, radius) aligned with `artemisluna.com.br`.
- Reusable `SiteBranch` tree navigation component.
- Refactored `MainLayout`: fixed navbar, collapsible mobile menu, sticky sidebar, centered max-width shell.
- Refactored `AdminLayout`: same shell as `MainLayout`, with admin-only sidebar branch that expands when inside `/admin/*`.
- Home page restructured: map first (above), filter + event list second (below).
- Remove card-heavy presentation on home/list/detail pages; use open layout spacing.
- Rounded borders for images, maps, and media containers.
- Sidebar footer with copyright notice linking to Luna G. Cezar and `artemisluna.com.br`.
- i18n strings for new navigation labels and sidebar footer.
- Tests updated to match new component structure.

**Out of scope:**

- Backend API changes.
- New features (events, matches, tournaments, stores) beyond layout/styling.
- Dark-mode toggle implementation already exists; only styling tokens change.

## 2. Definitions

| Term                    | Definition                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Shell**               | The combined navbar + sidebar + main-content wrapper that persists across routes.                                         |
| **SiteBranch**          | A recursive navigation component that renders a link and, when the route is active inside its subtree, its child links.   |
| **Navbar**              | The fixed top bar containing the app title, mobile toggle, and top-right controls.                                        |
| **Sidebar**             | The left-side navigation panel on large screens; collapses into the navbar drawer on small screens.                       |
| **artemisluna palette** | The purple-tinted oklch color system and `Bitter Variable` / `Cascadia Code Variable` fonts used on `artemisluna.com.br`. |

## 3. Requirements, Constraints & Guidelines

### 3.1 Visual Design (REQ-VIS)

- **REQ-VIS-001**: The app uses the `artemisluna.com.br` color palette:
  - Light background: `oklch(97.58% 0.00577 307.732)`
  - Light foreground: `oklch(37.028% 0.04981 305.31)`
  - Light primary: `oklch(44.931% 0.23806 292.639)`
  - Light muted: `oklch(92.126% 0.01161 308.012)`
  - Light border: `oklch(86.149% 0.02188 306.656)`
  - Dark background: `oklch(23.564% 0.03101 298.325)`
  - Dark foreground: `oklch(88.56% 0.0227 302.771)`
  - Dark primary: `oklch(76.055% 0.14161 300.455)`
  - Dark muted: `oklch(33.928% 0.03376 299.038)`
  - Border radius base: `0.625rem`.
- **REQ-VIS-002**: Body font is `Bitter Variable`, font-weight 500; monospace/code font is `Cascadia Code Variable`.
- **REQ-VIS-003`: Images, maps, and media containers use rounded corners (`border-radius: 0.625rem`/`var(--radius-lg)`).
- **REQ-VIS-004**: Cards are removed from list/feed surfaces; content sits directly on the page background with subtle borders or dividers.

### 3.2 Layout (REQ-LYT)

- **REQ-LYT-001**: On large screens (`lg` and up) the page content is constrained to a centered max-width: `lg:w-3/4 xl:w-2/3 2xl:w-4/7` equivalent.
- **REQ-LYT-002**: A fixed top navbar (`h-12` / 48px) spans the same max-width container, centered, with a bottom border and translucent backdrop blur.
- **REQ-LYT-003**: On large screens a sticky left sidebar (`w-48` / 192px, `h-screen`, `pt-12`) holds the primary navigation tree.
- **REQ-LYT-004**: On small screens the sidebar is hidden; the navbar contains a hamburger button that opens a collapsible drawer reusing the same navigation tree.
- **REQ-LYT-005**: The main content area fills remaining width, with top padding to clear the navbar and horizontal padding.
- **REQ-LYT-006**: The sidebar footer contains a copyright line: "© Luna G. Cezar — artemisluna.com.br" (translatable label key `sidebar.copyright`).

### 3.3 Navigation (REQ-NAV)

- **REQ-NAV-001**: The sidebar/drawer tree contains:
  - Home (`/`)
  - Matches (`/matches`)
  - Trading (`/trading`)
  - Tournaments (`/tournaments`)
  - Stores (`/stores`)
  - Admin (`/admin`) — visible only when the authenticated user has role `admin`
- **REQ-NAV-002**: The Admin branch is a parent node. When the current route starts with `/admin`, the branch expands to show its children: Dashboard, TCGs, Users, Stores, Reports, Audit Log.
- **REQ-NAV-003**: Active route links use the primary background color and primary foreground; inactive links use ghost styling.
- **REQ-NAV-004**: Top-right navbar controls on all screen sizes include dark-mode toggle and language switcher.
- **REQ-NAV-005**: On small screens the navbar drawer also includes dark-mode toggle and language switcher at the bottom.

### 3.4 Home Page (REQ-HOME)

- **REQ-HOME-001**: The home page is a vertical stack on all screen sizes.
- **REQ-HOME-002**: The map section is first (above the fold), with a fixed or min-height of approximately `50vh` / `400px` and rounded corners.
- **REQ-HOME-003**: Below the map, the filter bar and event feed/list are stacked vertically.
- **REQ-HOME-004**: Event feed items are rendered as rows with a subtle bottom border or background hover state, not as cards.
- **REQ-HOME-005**: The filter bar uses pill/toggle buttons consistent with the new palette.

### 3.5 General Pages (REQ-PAGE)

- **REQ-PAGE-001**: `AppCard`, `AppListLayout`, `AppDetailLayout`, and auth forms remove outer card wrappers and use centered, max-width column layouts with rounded containers.
- **REQ-PAGE-002**: Admin pages keep tabular data but drop outer card wrappers around page headers.
- **REQ-PAGE-003**: Auth pages (login, signup, onboarding) are centered in a rounded bordered panel instead of an elevated card.

### 3.6 Constraints (CON)

- **CON-001**: No new third-party UI libraries. Use Quasar components, custom CSS, and the existing icon set.
- **CON-002`: Keep i18n in the existing `en-US`and`pt-BR` files.
- **CON-003**: Maintain all existing route guards and auth behavior.
- **CON-004**: Do not break existing tests; update or extend tests where structure changes.
- **CON-005**: Dark mode must remain functional; tokens must provide both light and dark values.

## 4. Interfaces & Data Contracts

### 4.1 `SiteBranch` component

```ts
interface SiteBranchProps {
  node: NavNode;
  depth?: number;
}

interface NavNode {
  href: string;
  labelKey: string;
  children?: NavNode[];
  adminOnly?: boolean;
}
```

- `node`: navigation node to render.
- `depth`: recursion depth for indentation (default 0).
- Renders a link and recursively renders children when the current route is inside `node.href`.

### 4.2 `useNavTree` composable

Returns the navigation tree with admin branch conditional on current user role.

```ts
interface UseNavTreeReturn {
  tree: ComputedRef<NavNode[]>;
  isActive(node: NavNode): boolean;
  hasActiveDescendant(node: NavNode): boolean;
}
```

### 4.3 Updated `navItems.ts`

Exports a tree-shaped `navTree: NavNode[]` in addition to the existing flat `navItems`. Existing tests that rely on `navItems` continue to pass.

## 5. Acceptance Criteria

- **AC-001**: Given a large screen, When the app loads, Then the layout is centered with a max-width, left sidebar is visible, and top navbar is fixed.
- **AC-002**: Given a small screen, When the app loads, Then the sidebar is hidden and a hamburger icon opens a drawer containing the navigation tree.
- **AC-003**: Given an unauthenticated user, When the navigation renders, Then the Admin branch is not shown.
- **AC-004**: Given an authenticated admin, When the user navigates to `/admin`, Then the Admin branch expands and shows Dashboard, TCGs, Users, Stores, Reports, Audit Log.
- **AC-005**: Given the home page, When it renders, Then the map is above the filter bar and event list, and the map has rounded corners.
- **AC-006**: Given the event feed, When events are listed, Then each item is a row with a bottom border, not a card.
- **AC-007**: Given the sidebar footer, When it renders, Then it shows "© Luna G. Cezar — artemisluna.com.br" linking to `https://artemisluna.com.br`.
- **AC-008**: Given the dark mode toggle, When clicked, Then the dark palette is applied and text remains readable.
- **AC-009**: Given the language switcher, When a language is selected, Then all new navigation labels translate.
- **AC-010**: Given the app renders, Then body text uses `Bitter Variable` and code uses `Cascadia Code Variable`.

## 6. Test Automation Strategy

- **Unit tests** with Vitest and `@vue/test-utils`.
- Update `MainLayout.test.ts` to assert:
  - App title renders in the navbar.
  - Sidebar navigation tree renders on desktop.
  - Admin branch does/does not render based on `useAuthStore` mock role.
  - Mobile menu toggle opens the drawer.
- Update `IndexPage.test.ts` to assert map is rendered above the event list.
- Add `SiteBranch.test.ts` to assert recursive expansion when active.
- Add `useNavTree.test.ts` to assert admin branch conditional logic.
- Run `pnpm test` after implementation.

## 7. Rationale & Context

The current frontend uses Quasar defaults (elevated header, primary blue, card-heavy feeds) that feel like a generic dashboard. The reference site presents a calmer, editorial identity that better suits a community platform. By limiting width, adding a sticky sidebar tree, and removing unnecessary cards, the interface becomes more scannable and gives the map and event content more breathing room. Reusing the link tree between desktop sidebar and mobile drawer keeps navigation consistent and reduces code duplication.

## 8. Dependencies & External Integrations

- **Google Fonts / fontsource**: `Bitter Variable` and `Cascadia Code Variable` must be loadable. Use `@fontsource-variable/bitter` and `@fontsource-variable/cascadia-code` if available, otherwise load via Google Fonts CDN.
- **Quasar**: Layout, header, drawer, button, badge, and dark plugin remain; styles override default colors.
- **Vue Router**: Active route detection drives sidebar expansion.
- **Pinia `useAuthStore`**: Provides current user and role for admin branch visibility.
- **Pinia `useAppStore`**: Provides theme and locale state.

## 9. Examples & Edge Cases

### 9.1 Navigation tree expansion

```
Current route: /admin/users

Sidebar:
  Home
  Matches
  Trading
  Tournaments
  Stores
  ▼ Admin (active)
    ├─ Dashboard
    ├─ TCGs
    ├─ Users (active)
    ├─ Stores
    ├─ Reports
    └─ Audit Log
```

### 9.2 Mobile drawer

On screens narrower than `lg`, the sidebar is replaced by a drawer. The same `SiteBranch` component renders the tree. Tapping a link closes the drawer.

### 9.3 Admin branch hidden

When the user is not an admin, the Admin node is filtered out entirely, including any child routes.

## 10. Validation Criteria

- All existing Vitest tests pass after updates.
- New tests for `SiteBranch`, `useNavTree`, and updated layout tests pass.
- `pnpm lint` and `pnpm format:check` pass.
- Manual visual check: layout matches reference proportions (centered max-width, fixed navbar, sticky sidebar, rounded map).

## 11. Related Specifications / Further Reading

- `spec-015-frontend-foundation.md` — original layout, auth, and i18n.
- `spec-032-navbar-components.md` — `ThemeLangSwitcher` and `UserMenu`.
- `spec-023-home-page.md` — original home page design.
- `spec-018-admin-pages.md` — original admin layout.
- `artemisluna.com.br` source in `/home/luna/Workspace/artemisluna.com.br`.
