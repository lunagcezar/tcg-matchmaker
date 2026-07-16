---
title: Bracket Match Auth Guard & Onboarding POST Tests
version: 1.0
date_created: 2026-07-15
tags: worker, auth, tournaments, security
---

## 1. Purpose & Scope

Add organizer-only authorization to bracket match reporting/walkover endpoints and add regression tests for onboarding POST.

## 2. Changes

### Bracket match report/walkover — organizer guard

Added `orgGuardByMatch()` helper that walks `bracket_matches → bracket_rounds → events` to verify the requesting user is the tournament creator. Applied to both `POST /:id/report` and `POST /:id/walkover`.

### TypeScript safety

Extract `c.req.param('id')` into a guarded variable before passing to `orgGuardByMatch()` to satisfy strict null checks.

### Tests

- `POST /api/auth/onboarding` — 201 success and 400 duplicate-admin cases
- `POST /api/bracket-matches/:id/report` — 403 for non-organizer, 200 for organizer
- `POST /api/bracket-matches/:id/walkover` — 403 for non-organizer

## 3. Acceptance Criteria

- **AC-001**: `POST /api/bracket-matches/:id/report` returns 403 when the caller is not the tournament creator.
- **AC-002**: `POST /api/bracket-matches/:id/walkover` returns 403 when the caller is not the tournament creator.
- **AC-003**: `POST /api/bracket-matches/:id/report` returns 200 when the caller is the tournament creator.
- **AC-004**: `POST /api/auth/onboarding` returns 201 on first admin creation.
- **AC-005**: `POST /api/auth/onboarding` returns 400 when an admin already exists.
