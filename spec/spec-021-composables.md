---
title: Domain Composables — VueUse + Typed API Clients
version: 1.0
date_created: 2026-07-14
tags: frontend, composables, vueuse, api
---

# Introduction

This specification implements typed domain composables for each API domain. They leverage VueUse utilities and the `useApi` Hono client for type-safe API calls from Vue components.

## 1. Purpose & Scope

**Purpose:** Create reusable, typed composables for each backend domain, eliminating raw fetch calls from pages.

**Scope:**

- Install `@vueuse/core` for utilities (useStorage, useDebounce, useGeolocation)
- `useTcg` — list, create, soft-delete TCGs
- `useStore` — list, create, update, get stores + memberships
- `useEvent` — list, create, join, confirm events
- `useTournament` — list, create, register, bracket queries
- `useGeolocation` — wrapper around VueUse's useGeolocation + Nominatim search

**Out of scope:**

- Replacing existing fetch calls in admin pages (incremental)
- Test coverage (added when pages are implemented)

## 2. Acceptance Criteria

- **AC-001**: VueUse composables are importable from `@vueuse/core`.
- **AC-002**: `useTcg` has list/create/remove methods.
- **AC-003**: `useStore` has list/create/update/getMembers methods.
- **AC-004**: `useEvent` has list/create/join/confirm methods.
- **AC-005**: `useTournament` has list/create/register/getBracket methods.
- **AC-006**: `useGeolocation` returns current position + search function.
- **AC-007**: Frontend build succeeds.
- **AC-008**: All 60 worker tests still pass.
