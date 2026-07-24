---
title: Filter Segmented Control, Admin Table Styling, Misc UX
version: 1.0
date_created: 2026-07-23
tags: frontend, ux, tables
---

# Introduction

Replace `q-btn-toggle` filter controls with custom segmented-control buttons that wrap on small screens, restyle admin tables to match page background, and fix notification button padding.

## 1. Purpose & Scope

- Unify filter controls across home and matches list pages using a segmented-control pattern
- Style admin tables with transparent background and proper alignment
- Fix notification bell padding to match nav buttons

## 2. Requirements

- **REQ-001**: Filter buttons must be native `<button>` elements with `all: unset`, wrapped in a container with a shared outer border and inner dividers.
- **REQ-002**: Inactive buttons: ghost/transparent, muted color. Active button: bold, primary color.
- **REQ-003**: Container must `flex-wrap` on small screens.
- **REQ-004**: Admin `q-table` background must be transparent, all cells left-aligned except `actions` column which is right-aligned.
- **REQ-005**: Notification bell `q-btn-dropdown` must use `dense` to match other nav buttons.

## 3. Acceptance Criteria

- **AC-001**: Given the home page or matches list page, filter buttons render as a segmented group with outer border.
- **AC-002**: Given a small screen (<480px), filter buttons wrap to multiple rows.
- **AC-003**: Given an admin page with a table, the table background matches the page background.
- **AC-004**: Given the navbar, the notification bell has the same padding as other nav buttons.
