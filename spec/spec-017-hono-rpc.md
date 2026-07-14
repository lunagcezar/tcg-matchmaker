---
title: Hono RPC — End-to-End Typed API Client
version: 1.0
date_created: 2026-07-14
tags: frontend, api, hono, rpc, types
---

# Introduction

This specification sets up `hono/client` for fully typed API calls from the frontend to the Worker. Every route's request and response types are inferred from the Worker's route definitions, eliminating manual type duplication.

## 1. Purpose & Scope

**Purpose:** Configure Hono RPC so the frontend makes type-safe API calls without manually defining request/response types.

**Scope:**

- Add `hono` as a frontend dependency (for `hono/client`)
- Create `useApi` composable wrapping `hc()` with base URL from env
- Verify type checking across the frontend→Worker boundary
- Add typed helper functions for each API domain

**Out of scope:**

- Replacing existing fetch calls in stores (done incrementally)
- API mocking in tests (covered by MSW or Playwright)

## 2. Implementation

```typescript
// src/composables/useApi.ts
import { hc } from 'hono/client';
import type { AppType } from '@tcg/worker';

const client = hc<AppType>(import.meta.env.VITE_API_URL || '');

export function useApi() {
  return client;
}
```

## 3. Acceptance Criteria

- **AC-001**: `useApi()` returns a typed client matching all Worker routes.
- **AC-002**: Frontend TypeScript compiles without errors (`quasar build`).
- **AC-003**: All 60 worker tests still pass.
