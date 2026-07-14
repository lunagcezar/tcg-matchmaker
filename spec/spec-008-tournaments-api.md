---
title: Tournaments API — CRUD, Registration, Bracket Generation & Match Advancement
version: 1.0
date_created: 2026-07-14
tags: api, tournaments, brackets, tdd
---

# Introduction

This specification adds the Tournament management API. Tournaments have a lifecycle (draft → open → in_progress → completed), support player registration/check-in, generate single-elimination brackets on start, and handle match reporting with winner advancement and walkovers.

## 1. Purpose & Scope

**Purpose:** Implement tournament CRUD, registration, bracket generation (single elimination), match reporting, and winner advancement, following TDD.

**Scope:**
- Tournament create (draft), list, get, update, publish (→open), cancel
- Player registration + organizer check-in
- Start tournament → generate single-elimination bracket rounds + matches
- Report match result + advance winner to next match
- Walkover (W.O.) for no-shows
- Get full bracket (rounds + matches)

**Out of scope:**
- Double elimination, round robin, swiss, pool play brackets (future specs)
- Notifications (separate spec)

## 2. Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/tournaments` | Yes | Create tournament (status: draft) |
| `GET` | `/api/tournaments` | No | List tournaments |
| `GET` | `/api/tournaments/:id` | No | Get tournament details |
| `PATCH` | `/api/tournaments/:id` | Organizer | Update tournament fields |
| `POST` | `/api/tournaments/:id/publish` | Organizer | Change status draft → open |
| `POST` | `/api/tournaments/:id/cancel` | Organizer | Cancel tournament |
| `POST` | `/api/tournaments/:id/register` | Yes | Register as participant |
| `POST` | `/api/tournaments/:id/check-in` | Organizer | Check in participant |
| `POST` | `/api/tournaments/:id/start` | Organizer | Start → generate bracket, set in_progress |
| `GET` | `/api/tournaments/:id/bracket` | No | Get bracket (rounds + matches) |
| `POST` | `/api/bracket-matches/:id/report` | Participant | Report match result |
| `POST` | `/api/bracket-matches/:id/walkover` | Organizer | Mark as walkover |

## 3. Acceptance Criteria

- **AC-001**: `POST /api/tournaments` creates a draft tournament, returns 201.
- **AC-002**: `POST /api/tournaments/:id/publish` changes status to open.
- **AC-003**: `POST /api/tournaments/:id/register` adds participant.
- **AC-004**: `POST /api/tournaments/:id/start` generates bracket rounds + matches, status → in_progress.
- **AC-005**: `GET /api/tournaments/:id/bracket` returns rounds with matches.
- **AC-006**: `POST /api/bracket-matches/:id/report` sets winner and advances.
- **AC-007**: `POST /api/bracket-matches/:id/walkover` sets walkover status.
- **AC-008**: All 29 existing tests still pass.
- **AC-009**: Worker TypeScript compiles without errors.
