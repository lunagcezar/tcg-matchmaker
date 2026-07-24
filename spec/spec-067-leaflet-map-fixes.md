---
title: Leaflet Map Fixes — Z-Index, Attribution, Animation
version: 1.0
date_created: 2026-07-23
tags: frontend, map, leaflet
---

# Introduction

Fix three Leaflet map issues: zoom controls appearing above the navbar, remove attribution, and prevent jarring repositioning animation on marker updates.

## 1. Purpose & Scope

- Lower Leaflet zoom control z-index to stay below the navbar
- Remove attribution control from the map
- Disable `fitBounds` animation to prevent map jumping on marker updates

## 2. Requirements, Constraints & Guidelines

- **REQ-001**: Leaflet zoom controls must not appear above the app navbar.
- **REQ-002**: Attribution control must be removed from the map.
- **REQ-003**: `fitBounds` must not animate — no panning/zooming transition.
- **CON-001**: Use `attributionControl: false` in map constructor.
- **CON-002**: Use `{ animate: false, duration: 0 }` in `fitBounds` calls.
- **CON-003**: Override `.leaflet-control-zoom` z-index via scoped deep selector.

## 3. Interfaces & Data Contracts

No changes to component props or public API.

## 4. Acceptance Criteria

- **AC-001**: Given the home page with the map visible, zoom buttons do not overlap or sit above the navbar.
- **AC-002**: Given the map, the bottom-right attribution is not visible.
- **AC-003**: Given events loading on the map, markers appear without a panning/zooming animation.

## 5. Test Automation Strategy

- No new tests — purely visual/CSS fix.
- All 195 existing tests continue to pass.

## 6. Rationale & Context

Leaflet defaults to z-index 1000 for controls, which exceeds the navbar z-index. The attribution control adds visual noise in an app context. `fitBounds` with animation causes a jarring zoom/pan effect each time events are fetched or filtered.
