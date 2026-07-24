---
title: Map+List Layout, Dark Mode Map, and UX Fixes
version: 1.0
date_created: 2026-07-23
tags: frontend, layout, map, ux
---

# Introduction

Refactor the home page and list pages to use a consistent full-viewport layout with a map on top and a scrollable list below, add dark mode map tiles, and fix maps filtering by tabs/search.

## 1. Purpose & Scope

- Create reusable `MapListLayout` component for the map + scrollable list pattern
- Apply it to home page and all list pages (matches, trading, tournaments, stores)
- Switch Leaflet tiles to CartoDB dark variant when Quasar dark mode is active
- Ensure maps show only filtered events (respecting tabs and search)
- Remove unused components (`EventFeed`, `AppListLayout` from list pages)

## 2. Definitions

- **MapListLayout**: A full-viewport layout component with optional map section (40vh), sticky filter bar, and scrollable list area.
- **CartoDB dark tiles**: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` — dark-themed OpenStreetMap tiles.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: `MapListLayout` must fill 100dvh with no page-level scrollbar.
- **REQ-002**: The map section must be `flex: 0 0 40vh` and hidden when no `#map` slot is provided.
- **REQ-003**: The list section must fill remaining height and scroll internally.
- **REQ-004**: `EventMap` must switch to dark tiles when `$q.dark.isActive` changes.
- **REQ-005**: Maps on list pages must show only filtered events (matching the active tab or search query).
- **REQ-006**: `q-infinite-scroll` must bind `scroll-target` to the scrollable container ref.
- **CON-001**: No `vue-tsc` type errors — `scroll-target` prop must receive `Element | string | undefined`.
- **CON-002**: Leaflet tile attribution must match the tile provider.

## 4. Interfaces & Data Contracts

### MapListLayout props

| Prop        | Type        | Description                 |
| ----------- | ----------- | --------------------------- |
| `items`     | `unknown[]` | Items array for empty check |
| `loading`   | `boolean`   | Loading state               |
| `emptyText` | `string`    | Empty state message         |

### MapListLayout slots

| Slot       | Content              |
| ---------- | -------------------- |
| `#map`     | Map component        |
| `#filters` | Filter bar / actions |
| `#items`   | Scrollable list      |

### MapListLayout expose

| Property    | Type                  |
| ----------- | --------------------- |
| `scrollRef` | `HTMLElement \| null` |

## 5. Acceptance Criteria

- **AC-001**: Given any list page, when rendered, the page fills the viewport with no body scrollbar; only the list area scrolls.
- **AC-002**: Given the home page with dark mode enabled, the map shows dark tiles.
- **AC-003**: Given a list page with an active filter tab, the map shows markers only for the filtered events.
- **AC-004**: Given `vue-tsc --noEmit`, no type errors are reported.

## 6. Test Automation Strategy

- Existing IndexPage tests updated to mock `MapListLayout` instead of `EventFeed`.
- List page tests pass with updated stubs.
- All 195 tests pass (83 worker + 112 frontend).

## 7. Rationale & Context

The previous layout had a page-level scrollbar and the EventFeed component managing infinite scroll through prop-drilling. Moving to `MapListLayout` simplifies the component tree, eliminates prop-drilling for `scroll-target`, and provides a consistent full-viewport experience.

## 8. Dependencies & External Integrations

- **Leaflet**: Map rendering. Tile URL switches based on dark mode.
- **Quasar Dark plugin**: `$q.dark.isActive` drives tile selection.
- **CartoDB**: Dark tile provider for dark mode.

## 9. Related Specifications / Further Reading

- `spec/spec-060-visual-refactor.md` — Original layout and theme tokens
