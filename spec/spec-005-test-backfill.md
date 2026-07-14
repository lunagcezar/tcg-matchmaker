---
title: Test Backfill & TDD Infrastructure
version: 1.0
date_created: 2026-07-14
tags: testing, tdd, vitest, backfill
---

# Introduction

Backfill tests for all existing code (specs 002-004) and establish the testing infrastructure for future TDD-driven specs. Tests verify behavior through public interfaces — Hono route responses and middleware behavior.

## 1. Purpose & Scope

**Purpose:** Set up Vitest in the worker package and write tests covering all existing API routes and middleware. Establish testing patterns (seams, mocks, assertions) so future specs can follow TDD strictly.

**Scope:**
- Vitest config for the worker package
- Shared test utilities (mock Supabase client, test app factory)
- Tests for `middleware/auth.ts` — JWT verification, banned check
- Tests for `middleware/admin.ts` — role check
- Tests for `auth/index.ts` — all 7 routes
- Tests for `tcgs/index.ts` — all TCG + format routes

**Out of scope:**
- Shared package Zod schema tests (simple enough to trust)
- Supabase migration tests (requires running Supabase stack)
- Frontend component tests (covered in a future spec)

## 2. Test Seams

Agreed test boundaries (seams):

| Seam | What it tests | Mock boundary |
|------|--------------|---------------|
| **Auth middleware** | Returns 401/403/404 correctly based on request context | `@supabase/supabase-js` — mock `auth.getUser()` and `from().select()` |
| **Admin middleware** | Returns 403 for non-admin, passes for admin | `c.var.user` set by auth middleware (already verified) |
| **Auth routes** | Each route returns correct status + body for success/error cases | `@supabase/supabase-js` — mock all DB queries |
| **TCG routes** | CRUD behavior, auth guards, soft-delete filtering | `@supabase/supabase-js` — mock all DB queries |

## 3. Test Structure

```
packages/worker/
  src/
    middleware/
      __tests__/
        auth.test.ts
        admin.test.ts
    auth/
      __tests__/
        index.test.ts
    tcgs/
      __tests__/
        index.test.ts
  test/
    helpers.ts          # Mock Supabase client factory, test app builder
    mocks.ts            # Mock data (users, tcgs, formats)
  vitest.config.ts      # Vitest configuration
```

## 4. Requirements

- **TST-001**: Each test file must use `describe` blocks grouping related tests.
- **TST-002**: Tests must verify both success and error paths for each route.
- **TST-003**: Auth middleware tests must cover: missing header (401), invalid token (401), banned user (403), deleted user (404), valid user (pass through).
- **TST-004**: Admin middleware tests must cover: non-admin user (403), admin user (pass through).
- **TST-005**: Auth route tests must cover all 7 routes with at least 2 cases each (success + error).
- **TST-006**: TCG route tests must cover public reads, admin writes, auth guards, and soft-delete filtering.
- **TST-007**: Mock `@supabase/supabase-js` at the module level using `vi.mock`.
- **TST-008**: Tests must use the Hono `app.request()` method to simulate HTTP requests.
- **TST-009**: `pnpm -F @tcg/worker test` must pass with all tests green.

## 5. Acceptance Criteria

- **AC-001**: `pnpm -F @tcg/worker test` passes with all tests.
- **AC-002**: Auth middleware has 5+ test cases covering all code paths.
- **AC-003**: Admin middleware has 2 test cases.
- **AC-004**: Auth routes have 14+ test cases (2 per route).
- **AC-005**: TCG routes have 10+ test cases covering CRUD + auth guards.
- **AC-006**: `pnpm -F @tcg/worker exec tsc --noEmit` still passes.
- **AC-007**: Test output is clean (no warnings, no errors).

## 6. Related Specifications

- `spec/spec-002-auth-system.md` — Code under test
- `spec/spec-004-tcgs-and-formats-api.md` — Code under test
- `.agents/skills/test-driven-development/SKILL.md` — TDD conventions
- `.agents/skills/tdd/tests.md` — Good test examples
- `.agents/skills/tdd/mocking.md` — Mocking guidelines
