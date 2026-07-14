---
title: Notifications API — In-App Notifications & Push Subscriptions
version: 1.0
date_created: 2026-07-14
tags: api, notifications, push, realtime
---

# Introduction

This specification adds the Notifications API. Users can list, read, and manage their in-app notifications. Push subscriptions allow browser push notifications via the Web Push API.

## 1. Purpose & Scope

**Purpose:** Implement notification CRUD and push subscription management.

**Scope:**

- Notifications: list (auth user's own), mark as read, mark all as read
- Push subscriptions: create, delete
- Unread count endpoint for badge display

**Out of scope:**

- Actually sending in-app notifications on events (triggered by event service, not this spec)
- Sending push notifications via Web Push API (requires service worker setup)
- Supabase Realtime frontend subscription

## 2. Routes

| Method   | Path                              | Auth | Description                              |
| -------- | --------------------------------- | ---- | ---------------------------------------- |
| `GET`    | `/api/notifications`              | Yes  | List user's notifications (unread first) |
| `GET`    | `/api/notifications/unread-count` | Yes  | Count of unread notifications            |
| `PATCH`  | `/api/notifications/:id/read`     | Yes  | Mark single notification as read         |
| `POST`   | `/api/notifications/read-all`     | Yes  | Mark all as read                         |
| `POST`   | `/api/push-subscriptions`         | Yes  | Save a push subscription                 |
| `DELETE` | `/api/push-subscriptions/:id`     | Yes  | Remove a push subscription               |

## 3. Acceptance Criteria

- **AC-001**: `GET /api/notifications` returns user's notifications.
- **AC-002**: `GET /api/notifications` without auth returns 401.
- **AC-003**: `PATCH /api/notifications/:id/read` marks as read.
- **AC-004**: `POST /api/notifications/read-all` marks all as read.
- **AC-005**: `GET /api/notifications/unread-count` returns count.
- **AC-006**: `POST /api/push-subscriptions` saves a subscription.
- **AC-007**: All 45 existing tests still pass.
