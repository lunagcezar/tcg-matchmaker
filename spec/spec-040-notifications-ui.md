---
title: Notifications UI
version: 1.0
date_created: 2026-07-15
tags: frontend, notifications, realtime, push
---

# Notifications UI

## 1. Purpose & Scope

Implement the frontend notification system for TCG Matchmaker. The Worker backend already provides notification CRUD routes (`GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`) and push subscription CRUD (`POST /api/push-subscriptions`, `DELETE /api/push-subscriptions/:id`). This spec wires the frontend to these endpoints with a composable, navbar bell badge, notification dropdown, a full notification list page, and basic push notification opt-in.

Scope includes:

- `useNotifications` composable (list, unread count, mark read, mark all read, Realtime subscription)
- `NotificationBell` component (navbar icon + unread badge)
- `NotificationList` component (recent notifications dropdown)
- Notification page at `/notifications`
- i18n strings
- Push notification opt-in toggle (settings page)
- Tests

## 2. Definitions

| Term              | Definition                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Notification      | In-app notification stored in `notifications` table with type, title, body, optional deep-link data |
| Unread count      | Number of notifications where `read_at IS NULL` for the current user                                |
| Push notification | Browser push notification via Web Push API (VAPID)                                                  |
| Realtime          | Supabase Realtime WebSocket subscription for live notification inserts                              |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Authenticated user sees a bell icon in the navbar with unread count badge
- **REQ-002**: Clicking the bell opens a dropdown showing the 5 most recent notifications with title, body, and relative timestamp
- **REQ-003**: Unread notifications in the dropdown show a blue dot indicator
- **REQ-004**: Clicking a notification marks it as read and navigates to the linked entity (if `data` has a deep-link path)
- **REQ-005**: Dropdown has a "View All" link to `/notifications`
- **REQ-006**: `/notifications` page shows a paginated list with mark-read per item and "Mark all as read" button
- **REQ-007**: Unread count updates in real time via Supabase Realtime channel subscription
- **REQ-008**: Unread count also refreshes on page focus (visibilitychange)
- **REQ-009**: Push notification opt-in toggle on settings page requests browser permission and registers push subscription via backend
- **REQ-010**: Unauthenticated users see no bell icon
- **REQ-011**: Notification data types: `type` string (e.g. "match_invite", "rsvp", "bracket_advance", "store_suspended", "tournament_started"), `data` JSON object with optional `path` field for deep-linking
- **CON-001**: Must use existing Worker notification routes (no new backend changes)
- **CON-002**: Must use Quasar's `QBadge`, `QIcon`, `QList`, `QItem` for consistency
- **GUD-001**: Composable accepts auth token from `useAuthStore` and uses raw `fetch` (Hono RPC client is statically typed but the notification routes need dynamic auth headers)
- **GUD-002**: Realtime channel subscribes to `notifications` table filtered by `user_id`

## 4. Interfaces & Data Contracts

### useNotifications composable

```ts
interface UseNotificationsReturn {
  notifications: Ref<Notification[]>;
  unreadCount: Ref<number>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeRealtime: () => void; // start Realtime channel
  unsubscribeRealtime: () => void; // cleanup
}
```

### Push subscription request body

```ts
interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
}
```

### Notification schema (from shared)

```ts
interface Notification {
  id: string; // UUID
  user_id: string; // UUID
  type: string; // e.g. "match_invite"
  title: string;
  body: string;
  data: Record<string, unknown> | null; // { path?: string }
  read_at: string | null; // ISO datetime
  created_at: string; // ISO datetime
}
```

## 5. Acceptance Criteria

- **AC-001**: Given an authenticated user with unread notifications, When the navbar renders, Then a bell icon with the correct unread count badge is displayed
- **AC-002**: Given a user clicks the bell, When the dropdown opens, Then 5 most recent notifications are shown, each with title, body, and relative timestamp; unread items have a dot indicator
- **AC-003**: Given a user clicks an unread notification, When the notification is clicked, Then it is marked as read via PATCH and the user navigates to the deep-link path (or does nothing if no path)
- **AC-004**: Given a user clicks "Mark all as read" in the dropdown or on the notifications page, When the action completes, Then unread count drops to 0 and all notifications appear read
- **AC-005**: Given a user visits `/notifications`, When the page loads, Then all notifications are displayed with mark-read buttons and a "Mark all as read" action
- **AC-006**: Given a new notification is inserted for the current user, When the Realtime channel delivers the event, Then unread count increments and the notification appears in the dropdown without page refresh
- **AC-007**: Given an unauthenticated user, When the navbar renders, Then no bell icon is shown
- **AC-008**: Given a user enables push notifications on settings page, When the browser grants permission, Then a push subscription is registered via POST /api/push-subscriptions
- **AC-009**: Given a user views a notification with a data.path, When clicked, Then the app navigates to that route (e.g. /matches/abc-123)

## 6. Test Automation Strategy

- **Test Levels**: Unit tests for composable (Vitest)
- **Frameworks**: Vitest with MSW for API mocking
- **Test Data**: Mock Notification[], Notification (single), unread count responses
- **Component tests**: Optional shallow mount of NotificationBell using @vue/test-utils
- **Coverage**: Focus on composable API calls, state updates, and Realtime subscription lifecycle

## 7. Rationale & Context

The Worker backend has been fully implemented with a notification system and push subscription CRUD. The frontend notification UI is the last major user-facing gap. Adding it completes the user experience loop: users receive in-app notifications for event invitations, RSVPs, bracket advances, and moderation actions.

Push notification support is kept minimal (basic opt-in UI and subscription registration) because the backend currently only stores subscriptions without sending actual push messages — that can be a future enhancement when VAPID keys and a push dispatch system are added.

## 8. Dependencies & External Integrations

### External Systems

- **Supabase Realtime**: WebSocket subscription for live notification inserts on `notifications` table (filtered by `user_id = eq.<current_user_id>`)

### Backend API (existing, no changes needed)

- `GET /api/notifications` — list user's notifications
- `GET /api/notifications/unread-count` — get unread count
- `PATCH /api/notifications/:id/read` — mark one read
- `POST /api/notifications/read-all` — mark all read
- `POST /api/push-subscriptions` — create push sub
- `DELETE /api/push-subscriptions/:id` — remove push sub

## 9. Examples & Edge Cases

**Edge cases:**

- User has 0 notifications: empty state message
- Unread count > 99: badge shows "99+"
- Realtime connection drops: composable should handle gracefully (silent failure, fetch on next user interaction)
- Multiple tabs: each tab independently fetches count; Realtime keeps them in sync
- Deep-link path is invalid: notification click marks as read but does not navigate (or navigates to home safely)

## 10. Validation Criteria

- All acceptance criteria pass
- `pnpm test` passes
- `pnpm lint` passes
- Manual verification: login, create an event, verify notification appears in bell dropdown

## 11. Related Specifications

- spec-012-notifications-api (backend notification routes)
