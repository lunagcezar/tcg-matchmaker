---
title: Admin Pages — TCG, User & Report Management UI
version: 1.0
date_created: 2026-07-14
tags: frontend, admin, tdd, pages
---

# Introduction

This specification implements the admin section pages: TCG management, user management, and report moderation UI. Pages use Quasar table components and connect to the Worker API via `fetch`.

## 1. Purpose & Scope

**Purpose:** Implement the admin pages with full CRUD for TCGs, user ban/promote, and report moderation.

**Scope:**

- Admin TCG list: fetch, display, create, soft-delete
- Admin Format list: fetch, display, create under a TCG
- Admin User list: fetch, display, ban, unban, promote
- Admin Report list: fetch, display, resolve, dismiss
- Admin Audit log: fetch, display

**Out of scope:**

- Dashboard stats page
- Admin store management (separate spec)

## 2. Pages

| Route                     | Component            | Description                        |
| ------------------------- | -------------------- | ---------------------------------- |
| `/admin/tcgs`             | `TcgListPage.vue`    | List TCGs, create new, soft-delete |
| `/admin/tcgs/:id/formats` | `FormatListPage.vue` | List formats for TCG, create new   |
| `/admin/users`            | `UserListPage.vue`   | List users, ban/unban, promote     |
| `/admin/reports`          | `ReportListPage.vue` | List reports, resolve/dismiss      |
| `/admin/audit`            | `AuditLogPage.vue`   | List audit log entries             |

## 3. Acceptance Criteria

- **AC-001**: TCG list page loads and displays TCGs.
- **AC-002**: User can navigate to format list from TCG row.
- **AC-003**: New TCG creation form submits to API.
- **AC-004**: User list page displays users.
- **AC-005**: Ban button exists on user rows.
- **AC-006**: Report list shows status badges.
- **AC-007**: All 60 worker tests still pass.
