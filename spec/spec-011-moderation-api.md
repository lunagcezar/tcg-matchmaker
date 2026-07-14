---
title: Moderation API — Reports, User Bans, Admin Actions & Audit Log
version: 1.0
date_created: 2026-07-14
tags: api, moderation, reports, admin, audit
---

# Introduction

This specification adds the Moderation API. Authenticated users can report stores, users, or events. Admins review reports, ban/unban users, promote admins, remove avatars, and all actions are logged in the audit log.

## 1. Purpose & Scope

**Purpose:** Implement report CRUD, user moderation (ban/unban/promote/avatar), and audit logging.

**Scope:**

- Reports: create (auth), list (admin), resolve/dismiss (admin)
- User moderation: ban, unban, promote to admin, remove avatar
- Audit log: auto-logged on moderation actions, list (admin)

**Out of scope:**

- Store suspension (already implemented in spec-006)
- Event soft-delete (already implemented)

## 2. Routes

| Method   | Path                           | Auth  | Description                     |
| -------- | ------------------------------ | ----- | ------------------------------- |
| `POST`   | `/api/reports`                 | Yes   | Create a report (any auth user) |
| `GET`    | `/api/reports`                 | Admin | List reports (pending first)    |
| `PATCH`  | `/api/reports/:id`             | Admin | Resolve or dismiss a report     |
| `POST`   | `/api/admin/users/:id/ban`     | Admin | Ban a user                      |
| `POST`   | `/api/admin/users/:id/unban`   | Admin | Unban a user                    |
| `POST`   | `/api/admin/users/:id/promote` | Admin | Promote user to admin           |
| `DELETE` | `/api/admin/users/:id/avatar`  | Admin | Remove user avatar              |
| `GET`    | `/api/admin/audit-log`         | Admin | List audit log entries          |

## 3. Acceptance Criteria

- **AC-001**: `POST /api/reports` creates a report, returns 201.
- **AC-002**: `POST /api/reports` without auth returns 401.
- **AC-003**: `GET /api/reports` by admin returns report list.
- **AC-004**: `GET /api/reports` by non-admin returns 403.
- **AC-005**: `POST /api/admin/users/:id/ban` sets `banned_at` on user.
- **AC-006**: `POST /api/admin/users/:id/promote` sets role to admin.
- **AC-007**: `GET /api/admin/audit-log` by admin returns log entries.
- **AC-008**: All 40 existing tests still pass.
