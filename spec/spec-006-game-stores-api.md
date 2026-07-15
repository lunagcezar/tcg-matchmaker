---
title: Game Stores API — CRUD, Memberships & Admin Operations
version: 1.0
date_created: 2026-07-14
tags: api, stores, memberships, crud
---

# Introduction

This specification adds the Game Store management API routes to the Worker. Stores are community hubs where players find matches and tournaments. Any authenticated user can create a store; owners manage members; admins verify/suspend.

## 1. Purpose & Scope

**Purpose:** Implement store CRUD, membership management, and admin operations in the Worker following TDD (test-first).

**Scope:**

- Store routes (list, get, create, update, soft-delete)
- Membership routes (list members, add, update role, remove)
- Admin routes (verify, suspend)
- Auto-generated slug from store name on creation
- Shared schema updates (UpdateStoreSchema, slug generation)

**Out of scope:**

- Store-based event creation (spec-007)
- Store logo upload (spec-007)

## 2. Requirements

- **REQ-001**: `GET /api/stores` must list active (non-deleted, non-suspended) stores, ordered by name.
- **REQ-002**: `GET /api/stores/:id` must return a single store, or 404.
- **REQ-003**: `POST /api/stores` must create a store. Authenticated user becomes owner. Slug auto-generated from name. Returns 201.
- **REQ-004**: `PATCH /api/stores/:id` must update store details. Owner or manager only. Returns 403 for non-members.
- **REQ-005**: `DELETE /api/stores/:id` must soft-delete (admin only). Returns 403 for non-admin.
- **REQ-006**: `POST /api/stores/:id/verify` must set `is_verified = true` (admin only).
- **REQ-007**: `POST /api/stores/:id/suspend` must set `status = suspended` with reason (admin only).
- **REQ-008**: `GET /api/stores/:id/members` must list store members (owner/manager only).
- **REQ-009**: `POST /api/stores/:id/members` must add a member. Owner can add manager/staff; manager can add staff.
- **REQ-010**: `DELETE /api/stores/:id/members/:userId` must remove a member (owner only, cannot remove self if sole owner).
- **REQ-011**: All responses must use the `{ data, error, meta }` envelope.

## 3. Acceptance Criteria

- **AC-001**: `GET /api/stores` returns a list of active stores.
- **AC-002**: `POST /api/stores` with valid data creates a store and returns 201.
- **AC-003**: `POST /api/stores` without auth returns 401.
- **AC-004**: `PATCH /api/stores/:id` by non-owner/non-manager returns 403.
- **AC-005**: `DELETE /api/stores/:id` by non-admin returns 403.
- **AC-006**: `POST /api/stores/:id/verify` by admin sets `is_verified` to true.
- **AC-007**: `POST /api/stores/:id/members` adds a member with the specified role.
- **AC-008**: `DELETE /api/stores/:id/members/:userId` removes a member.
- **AC-009**: All 17 existing tests still pass.
- **AC-010**: Worker TypeScript compiles without errors.

## 4. Routes

| Method   | Path                              | Auth | Role          | Description                          |
| -------- | --------------------------------- | ---- | ------------- | ------------------------------------ |
| `GET`    | `/api/stores`                     | No   | —             | List active stores                   |
| `GET`    | `/api/stores/:id`                 | No   | —             | Get store by ID                      |
| `POST`   | `/api/stores`                     | Yes  | Any auth      | Create store (creator becomes owner) |
| `PATCH`  | `/api/stores/:id`                 | Yes  | Owner/Manager | Update store details                 |
| `DELETE` | `/api/stores/:id`                 | Yes  | Admin         | Soft-delete store                    |
| `POST`   | `/api/stores/:id/verify`          | Yes  | Admin         | Verify store                         |
| `POST`   | `/api/stores/:id/suspend`         | Yes  | Admin         | Suspend store                        |
| `GET`    | `/api/stores/:id/members`         | Yes  | Owner/Manager | List members                         |
| `POST`   | `/api/stores/:id/members`         | Yes  | Owner/Manager | Add member                           |
| `DELETE` | `/api/stores/:id/members/:userId` | Yes  | Owner         | Remove member                        |

## 5. Related Specifications

- `docs/requirements.md` — FR-14 to FR-22
- `docs/data-model.md` — Game Stores and Store Memberships tables
- `docs/use-cases.md` — UC-14, UC-15, UC-28, UC-29, UC-30
- `spec/spec-003-complete-database-schema.md` — DB schema
- `spec/spec-005-test-backfill.md` — Testing patterns
