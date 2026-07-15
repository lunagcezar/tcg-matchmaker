---
title: TCGs & Formats API — Admin CRUD Routes
version: 1.0
date_created: 2026-07-14
tags: api, tcg, format, admin, crud
---

# Introduction

This specification adds the TCG and Format management API routes to the Worker. TCGs and Formats are the foundational catalog entities — all matches, tournaments, and trading sessions reference them. Only admins can create, edit, or soft-delete them.

## 1. Purpose & Scope

**Purpose:** Implement CRUD routes for TCGs and Formats in the Worker, with admin-only write protection and public read access.

**Scope:**

- Admin middleware (`adminMiddleware`) that checks `user.role === "admin"`
- TCG routes (list, get, create, update, soft-delete)
- Format routes (list by TCG, create, update, soft-delete)
- Shared schema updates (update schemas, add list response schemas)

**Out of scope:**

- Frontend admin pages
- TCG/format snapshot logic for events (handled at event creation time)

## 2. Requirements

- **REQ-001**: `GET /api/tcgs` must return all non-deleted TCGs, ordered by name.
- **REQ-002**: `GET /api/tcgs/:id` must return a single TCG by ID, or 404.
- **REQ-003**: `POST /api/tcgs` must create a TCG. Admin-only. Validates with `CreateTcgSchema`. Returns 201.
- **REQ-004**: `PATCH /api/tcgs/:id` must update a TCG. Admin-only. Partial update allowed. Returns updated TCG.
- **REQ-005**: `DELETE /api/tcgs/:id` must soft-delete a TCG (set `deleted_at`). Admin-only. Returns 200.
- **REQ-006**: `GET /api/tcgs/:tcgId/formats` must return non-deleted formats for a TCG, ordered by name.
- **REQ-007**: `POST /api/tcgs/:tcgId/formats` must create a format under the TCG. Admin-only. Returns 201.
- **REQ-008**: `PATCH /api/formats/:id` must update a format. Admin-only. Returns updated format.
- **REQ-009**: `DELETE /api/formats/:id` must soft-delete a format. Admin-only. Returns 200.
- **REQ-010**: Soft-deleted entities must be filtered out from list/get responses.
- **REQ-011**: All responses must use the `{ data, error, meta }` envelope.

## 3. Acceptance Criteria

- **AC-001**: Unauthenticated requests to POST/PATCH/DELETE routes return 401.
- **AC-002**: Non-admin authenticated requests to POST/PATCH/DELETE routes return 403.
- **AC-003**: `GET /api/tcgs` returns an array of TCGs.
- **AC-004**: `POST /api/tcgs` with valid data creates a TCG and returns 201.
- **AC-005**: `DELETE /api/tcgs/:id` sets `deleted_at` and the TCG no longer appears in list.
- **AC-006**: `GET /api/tcgs/:tcgId/formats` returns formats for the given TCG.
- **AC-007**: `POST /api/tcgs/:tcgId/formats` with invalid data returns 400.
- **AC-008**: `PATCH /api/formats/:id` with partial data updates only the provided fields.
- **AC-009**: Worker TypeScript compiles without errors.
- **AC-010**: Frontend build succeeds.

## 4. Implementation Details

### Admin Middleware

```typescript
// packages/worker/src/middleware/admin.ts
import type { Context, Next } from 'hono';

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.var.user;
  if (user.role !== 'admin') {
    return c.json({ data: null, error: 'Forbidden', meta: null }, 403);
  }
  await next();
}
```

Usage: `app.use("/api/tcgs/*", authMiddleware, adminMiddleware)` or per-route.

### Route Structure

```
GET    /api/tcgs                → tcgRouter.list
GET    /api/tcgs/:id            → tcgRouter.get
POST   /api/tcgs                → tcgRouter.create (admin)
PATCH  /api/tcgs/:id            → tcgRouter.update (admin)
DELETE /api/tcgs/:id            → tcgRouter.remove (admin)

GET    /api/tcgs/:tcgId/formats → formatRouter.listByTcg
POST   /api/tcgs/:tcgId/formats → formatRouter.create (admin)

PATCH  /api/formats/:id         → formatRouter.update (admin)
DELETE /api/formats/:id         → formatRouter.remove (admin)
```

### Files to Create/Modify

| File                                      | Action                                   |
| ----------------------------------------- | ---------------------------------------- |
| `packages/worker/src/middleware/admin.ts` | Create — admin role check middleware     |
| `packages/worker/src/tcgs/index.ts`       | Create — TCG router with all CRUD routes |
| `packages/worker/src/index.ts`            | Modify — mount TCG + format routers      |

### Updated Schemas

Add to `packages/shared/src/schemas/tcg.ts`:

- `UpdateTcgSchema` — partial update schema (all fields optional)
- `UpdateFormatSchema` — partial update schema
- `TcgListResponseSchema` — array wrapper (optional)

## 5. Related Specifications

- `docs/requirements.md` — FR-11 to FR-13
- `docs/data-model.md` — TCGs and Formats tables
- `spec/spec-003-complete-database-schema.md` — DB schema for tcgs and formats
- `spec/spec-002-auth-system.md` — auth middleware dependency
