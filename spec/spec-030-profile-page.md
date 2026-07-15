---
title: Profile Page
version: 1.0
date_created: 2026-07-15
tags: frontend, profile
---

# Profile Page

## 1. Purpose & Scope

Implement a public profile page at `/profile/:username` that displays user information, role badge, and event history. The profile page is publicly accessible (no auth required) and shows a read-only view of a user's TCG activity.

## 2. Definitions

| Term          | Definition                                                                           |
| ------------- | ------------------------------------------------------------------------------------ |
| Profile       | Public user record: display_name, username, role, created_at                         |
| Event history | List of events (matches, trading sessions, tournaments) the user has participated in |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Route `/profile/:username` is publicly accessible
- **REQ-002**: Page shows user avatar placeholder, display_name, username, role badge, and member-since date
- **REQ-003**: Role badge is color-coded (admin=red, organizer=orange/warning, player=primary)
- **REQ-004**: Below the profile card, show the user's event history with event type badge, name, date, and status
- **REQ-005**: Each event in the history is a clickable link to the event's detail page
- **REQ-006**: Event type badges are color-coded (match=primary, trading=positive, tournament=warning)
- **REQ-007**: If the user has no events, show a "No events yet" message
- **REQ-008**: Show loading state while fetching; show "not found" state if user doesn't exist
- **REQ-009**: Meta tags set dynamically with the username in the title

## 4. Acceptance Criteria

- **AC-001**: Given a visitor navigates to `/profile/username`, When the page loads, Then the user's display_name, username, role badge, and join date are displayed
- **AC-002**: Given a user has participated in events, When the profile loads, Then each event is shown with type badge, name, date, and status
- **AC-003**: Given a user has no events, When the profile loads, Then "No events yet" is displayed
- **AC-004**: Given a visitor navigates to `/profile/nonexistent`, When the page loads, Then a "not found" message is shown

## 5. Dependencies

- Backend `GET /api/auth/me` and `GET /api/events` (via useEventStore)
- `useEventStore` for fetching associated events
