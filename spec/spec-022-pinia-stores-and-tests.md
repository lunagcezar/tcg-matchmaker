---
title: Pinia Stores & Frontend Tests
version: 1.0
date_created: 2026-07-14
tags: frontend, pinia, stores, testing, vitest
---

# Introduction

This specification creates Pinia stores for shared domain state and sets up Vitest for frontend testing. Shared state (event list, store list) moves to Pinia so multiple components can access it without prop drilling.

## 1. Purpose & Scope

**Purpose:** Convert shared composable state to Pinia stores and establish frontend testing patterns.

**Scope:**

- `useEventStore` — Pinia store for events (list, current, CRUD, join/confirm)
- `useStoreStore` — Pinia store for stores (list, current, CRUD)
- Vitest configuration for the frontend package
- Store tests with mocked fetch
- ESLint/tsconfig exclusion for test directories

## 2. Acceptance Criteria

- **AC-001**: `useEventStore.list` fetches and stores events.
- **AC-002**: `useEventStore.join` calls POST /api/events/:id/join.
- **AC-003**: Empty API response results in empty items array.
- **AC-004**: `quasar build` passes (test files excluded from type check).
- **AC-005**: `pnpm test` runs frontend + worker tests (63 total).
