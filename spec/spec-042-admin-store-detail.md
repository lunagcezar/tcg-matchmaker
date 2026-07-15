---
title: Admin Store Detail Page
version: 1.0
date_created: 2026-07-15
tags: frontend, admin, stores
---

# Admin Store Detail Page

## 1. Purpose & Scope

Implement the admin store detail page at `/admin/stores/:id`. This page was a 3-line stub — it needs a full implementation for admins to view store details, verify stores, suspend stores with a reason, soft-delete stores, edit store information, and view store members.

## 2. Definitions

| Term        | Definition                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------- |
| Verify      | Admin action setting `is_verified = true` on a store, granting a legitimacy badge            |
| Suspend     | Admin action setting `status = 'suspended'` with a reason, hiding the store from public view |
| Soft-delete | Admin action setting `deleted_at` timestamp, hiding the store permanently                    |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Page fetches store data via `GET /api/stores/:id` on mount using route param
- **REQ-002**: Displays store name, description, address, phone, website, status badge, and verification badge
- **REQ-003**: Shows a "Verify" button for unverified stores; shows a verified badge for verified stores
- **REQ-004**: Verify calls `POST /api/stores/:id/verify` and refreshes data
- **REQ-005**: Suspend button opens a Quasar dialog with a reason text field; on confirm, calls `POST /api/stores/:id/suspend` with reason
- **REQ-006**: Delete button opens a confirmation dialog; on confirm, calls `DELETE /api/stores/:id` and navigates back to store list
- **REQ-007**: Edit form allows changing name, description, address, phone, website via `PATCH /api/stores/:id`
- **REQ-008**: Members section shows list of store members with their roles
- **REQ-009**: Admin back button navigates to `/admin/stores`
- **REQ-010**: Uses `$q.notify` for success/error feedback on all actions
- **CON-001**: Follows same patterns as UserListPage and other admin pages
- **CON-002**: All user-facing strings use `$t()` i18n

## 4. Acceptance Criteria

- **AC-001**: Given an admin navigates to `/admin/stores/:id`, When the page loads, Then store name, description, address, phone, website, status, and verification are displayed
- **AC-002**: Given an unverified store, When the admin clicks "Verify", Then the store shows as verified
- **AC-003**: Given the admin clicks "Suspend" and enters a reason, When the dialog confirms, Then the store status changes to suspended
- **AC-004**: Given the admin clicks "Delete" and confirms, When the API responds, Then the page navigates back to `/admin/stores`
- **AC-005**: Given the admin edits store details and clicks save, When the API responds, Then the store info updates

## 5. Dependencies

- `GET /api/stores/:id` — store detail
- `POST /api/stores/:id/verify` — verify store
- `POST /api/stores/:id/suspend` — suspend store with reason
- `DELETE /api/stores/:id` — soft-delete store
- `PATCH /api/stores/:id` — edit store
- AdminLayout (already configured in routes)
