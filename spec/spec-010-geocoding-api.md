---
title: Geocoding API — Nominatim Proxy with KV Cache
version: 1.0
date_created: 2026-07-14
tags: api, geocoding, nominatim, kv, cache
---

# Introduction

This specification adds the Geocoding API to the Worker. Address autocomplete and reverse geocoding are proxied through Hono instead of called directly from the browser to respect Nominatim's usage policy and enable server-side caching in Cloudflare KV.

## 1. Purpose & Scope

**Purpose:** Implement a geocoding proxy endpoint for address autocomplete and reverse geocoding, with KV-based caching to minimize external API calls.

**Scope:**

- `GET /api/geocode/search?q=` — proxy Nominatim search (autocomplete)
- `GET /api/geocode/reverse?lat=&lng=` — proxy Nominatim reverse geocoding
- KV cache with configurable TTL (default 24h)
- Shared Zod schemas for geocode requests/responses
- Nominatim usage policy compliance (User-Agent header, rate limiting)

**Out of scope:**

- Map rendering (Leaflet — frontend)
- Browser geolocation (navigator.geolocation — frontend)
- Event map markers (frontend component)

## 2. Routes

| Method | Path                             | Auth | Description                            |
| ------ | -------------------------------- | ---- | -------------------------------------- |
| `GET`  | `/api/geocode/search?q=`         | No   | Search for locations by name           |
| `GET`  | `/api/geocode/reverse?lat=&lng=` | No   | Reverse geocode coordinates to address |

## 3. Acceptance Criteria

- **AC-001**: `GET /api/geocode/search?q=Rua` returns an array of suggestions.
- **AC-002**: `GET /api/geocode/reverse?lat=-3.7&lng=-38.5` returns an address.
- **AC-003**: Repeated identical requests return cached results (KV read).
- **AC-004**: Missing `q` parameter returns 400 for search.
- **AC-005**: Missing `lat` or `lng` returns 400 for reverse.
- **AC-006**: Nominatim response includes standard fields (display_name, lat, lng).
- **AC-007**: All 34 existing tests still pass.
- **AC-008**: Worker TypeScript compiles without errors.
