---
title: Playwright E2E Testing Setup
version: 1.0
date_created: 2026-07-14
tags: testing, playwright, e2e, frontend
---

# Introduction

This specification adds Playwright for end-to-end testing of the frontend. Baseline tests verify that all pages render without errors and navigation works correctly.

## 1. Purpose & Scope

**Purpose:** Set up Playwright in the frontend package and write baseline e2e tests.

**Scope:**

- Playwright installation and configuration
- Dev server integration (starts before tests, stops after)
- Baseline tests for all page routes
- CI-ready configuration

**Out of scope:**

- API mocking (deferred to when feature pages are implemented)
- Visual regression testing

## 2. Acceptance Criteria

- **AC-001**: `pnpm test:e2e` runs Playwright tests against the dev server.
- **AC-002**: Home page loads without errors.
- **AC-003**: Login page is accessible at `/login`.
- **AC-004**: Signup page is accessible at `/signup`.
- **AC-005**: All 60 worker tests still pass.
