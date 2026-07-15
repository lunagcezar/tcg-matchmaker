---
title: Confirmation Flow (Confirm/Decline RSVP)
version: 1.0
date_created: 2026-07-15
tags: frontend, events, confirmation
---

# Confirmation Flow

## 1. Purpose & Scope

Implement the full RSVP confirmation flow on match and trading session detail pages. Currently, users can only join/RSVP (status = pending), but cannot confirm or decline attendance afterward. This spec adds confirm/decline buttons, updates the backend to allow trading session RSVP via the join route, and adds a `decline` method to the event store.

## 2. Definitions

| Term      | Definition                                                      |
| --------- | --------------------------------------------------------------- |
| Pending   | Participant has joined/RSVP'd but not yet confirmed attendance  |
| Confirmed | Participant has confirmed they will attend                      |
| Declined  | Participant has declined the invitation or cancelled their RSVP |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Backend `POST /api/events/:id/join` accepts both `match` and `trading` event types (relax current match-only restriction)
- **REQ-002**: Match detail page shows "Confirm Attendance" button for participants with status `pending`
- **REQ-003**: Match detail page shows "Decline" button for participants with status `pending`
- **REQ-004**: Match detail page shows "Confirmed" badge for participants with status `confirmed`
- **REQ-005**: Trading detail page shows "RSVP" button for non-participants (status `planned` or `active`)
- **REQ-006**: Trading detail page shows "Confirm Attendance" and "Decline" after RSVP (status = pending)
- **REQ-007**: Trading detail page shows "Confirmed" badge after confirming
- **REQ-008**: All buttons show loading state during API calls
- **REQ-009**: All buttons use `$t()` for i18n
- **CON-001**: Uses existing backend endpoints (join, confirm, decline)
- **CON-002**: Uses `useEventStore` for API calls; add `decline` method

## 4. Backend Changes

Modify `POST /api/events/:id/join` in `packages/worker/src/events/index.ts`:

Current: `if (event.type !== "match")` → redirects to trading registration via rsvp endpoint
New: `if (event.type !== "match" && event.type !== "trading")` — allow both match and trading

## 5. Acceptance Criteria

- **AC-001**: Given a user has joined a match (status = pending), When they click "Confirm Attendance", Then their status changes to `confirmed`
- **AC-002**: Given a user has joined a match (status = pending), When they click "Decline", Then their status changes to `declined`
- **AC-003**: Given a user views a trading session, When they click "RSVP", Then their status becomes `pending`
- **AC-004**: Given a user has RSVP'd to a trading session (status = pending), When they click "Confirm Attendance", Then their status changes to `confirmed`
- **AC-005**: Given a user has RSVP'd to a trading session (status = pending), When they click "Decline", Then their status changes to `declined`

## 6. Dependencies

- `POST /api/events/:id/join` (backend — relax type restriction)
- `POST /api/events/:id/confirm` (backend — already exists)
- `POST /api/events/:id/decline` (backend — already exists)
- `useEventStore` — add `decline` method
