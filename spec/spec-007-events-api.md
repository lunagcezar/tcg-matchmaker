---
title: Events API — Matches & Trading Sessions
version: 1.0
date_created: 2026-07-14
tags: api, events, matches, trading, participants
---

# Introduction

This specification adds the Events API for Matches and Trading Sessions. Events share a unified data model with type-specific behavior. Participants join, confirm, or decline. Tournaments are covered separately (spec-008).

## 1. Purpose & Scope

**Purpose:** Implement event CRUD, participant management, and status transitions for matches and trading sessions, following TDD.

**Scope:**

- Event create, list, get, update, cancel
- Participant join, confirm, decline, list
- Status transitions (open→confirmed→completed, open→challenged→confirmed, planned→active→completed)
- Match-specific: auto-confirm when max participants reached
- Invitation: create event with invited users sets status to `challenged`

**Out of scope:**

- Tournaments and brackets (spec-008)
- Notifications (spec-009)
- Geocoding/autocomplete (separate spec)

## 2. Routes

| Method   | Path                           | Auth        | Description                                                 |
| -------- | ------------------------------ | ----------- | ----------------------------------------------------------- |
| `GET`    | `/api/events`                  | No          | List events (filters: type, status, tcg_id, lat/lng radius) |
| `GET`    | `/api/events/:id`              | No          | Get event details with participant count                    |
| `POST`   | `/api/events`                  | Yes         | Create match or trading session                             |
| `PATCH`  | `/api/events/:id`              | Creator     | Update event                                                |
| `DELETE` | `/api/events/:id`              | Creator     | Cancel event                                                |
| `POST`   | `/api/events/:id/join`         | Yes         | Request to join (match only)                                |
| `POST`   | `/api/events/:id/confirm`      | Participant | Confirm attendance                                          |
| `POST`   | `/api/events/:id/decline`      | Participant | Decline invitation                                          |
| `GET`    | `/api/events/:id/participants` | No          | List participants                                           |

## 3. Acceptance Criteria

- **AC-001**: `POST /api/events` creates a match and returns 201.
- **AC-002**: `POST /api/events` without auth returns 401.
- **AC-003**: `GET /api/events` returns a list of events.
- **AC-004**: `POST /api/events/:id/join` adds a participant with status pending.
- **AC-005**: `POST /api/events/:id/confirm` updates participant status to confirmed.
- **AC-006**: `POST /api/events/:id/decline` updates participant status to declined.
- **AC-007**: Creator can cancel their own event.
- **AC-008**: Non-creator cannot cancel an event.
- **AC-009**: All 23 existing tests still pass.
- **AC-010**: Worker TypeScript compiles without errors.
