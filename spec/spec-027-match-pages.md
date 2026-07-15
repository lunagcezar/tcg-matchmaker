---
title: Match Pages — List, Create, Detail
version: 1.0
date_created: 2026-07-14
tags: frontend, matches, pages
---

# Introduction

This specification implements match pages: browse matches, create a new match, and view match details with join/confirm/decline actions.

## 1. Purpose & Scope

**Purpose:** Implement match browsing, creation, and participation using `useEventStore`.

**Scope:**

- `MatchListPage` — browse matches with status filters
- `MatchCreatePage` — create match form with TCG, format, location, date
- `MatchDetailPage` — view match info, join, confirm, or decline
