---
title: Home Page — Map, Event Feed & Filters
version: 1.0
date_created: 2026-07-14
tags: frontend, home, map, leaflet
---

# Introduction

This specification implements the main home page with a split view: Leaflet map (left) and event feed (right). Users can browse events by location, filter by type and TCG, and use geolocation to find events near them.

## 1. Purpose & Scope

**Purpose:** Build the main landing page with map visualization, event listing, and filtering.

**Scope:**

- Leaflet map with OpenStreetMap tiles
- Color-coded markers by event type
- Event feed cards (compact, single-line)
- Filter bar: TCG dropdown + event type pills
- Geolocation button ("Find near me")
- Event type pills: Matches, Trading, Tournaments
- Create FAB on mobile, dropdown on desktop

**Out of scope:**

- Event creation forms (separate pages)
- Detail pages (separate specs)
