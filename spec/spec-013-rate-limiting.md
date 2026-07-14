---
title: Rate Limiting Middleware — KV-Based Request Throttling
version: 1.0
date_created: 2026-07-14
tags: middleware, rate-limit, kv, security
---

# Introduction

This specification adds a configurable rate limiting middleware powered by Cloudflare KV. It protects API endpoints from abuse by limiting requests per IP within a time window.

## 1. Purpose & Scope

**Purpose:** Implement a reusable rate limiter middleware using KV counters. Apply to critical auth and mutation endpoints.

**Scope:**

- KV-backed rate limiter with action name, max requests, and window TTL
- Reusable `rateLimitMiddleware(action, maxRequests, windowSeconds)` factory
- Applied to: onboarding (3/h), account delete (5/15m), and general write safeguards

## 2. Middleware API

```typescript
rateLimitMiddleware(action: string, maxRequests: number, windowSeconds: number)
```

Returns a Hono middleware that:

1. Extracts client IP from `CF-Connecting-IP` header (or remote address)
2. Builds KV key: `ratelimit:{action}:{ip}`
3. Reads current count from KV
4. If count >= maxRequests, returns 429
5. Else increments count with KV TTL

## 3. Routes to Protect

| Route                       | Action           | Limit | Window      |
| --------------------------- | ---------------- | ----- | ----------- |
| `POST /api/auth/onboarding` | `onboarding`     | 3     | 3600 (1h)   |
| `DELETE /api/auth/account`  | `account_delete` | 5     | 900 (15min) |

## 4. Acceptance Criteria

- **AC-001**: Rate limiter allows requests under the limit.
- **AC-002**: Rate limiter blocks requests at the limit with 429.
- **AC-003**: Rate limiter uses KV for counter storage.
- **AC-004**: Rate limiter extracts IP from CF-Connecting-IP header.
- **AC-005**: All 50 existing tests still pass.
