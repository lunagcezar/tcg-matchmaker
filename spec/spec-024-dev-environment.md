---
title: Dev Environment — Local Services for Playwright E2E
version: 1.0
date_created: 2026-07-14
tags: dev, e2e, playwright, supabase, environment
---

# Introduction

This specification configures the local development environment so Playwright e2e tests can run against a fully local stack (frontend + Worker + Supabase).

## 1. Purpose & Scope

**Purpose:** Make `pnpm test:e2e` work locally by starting all required services and providing proper environment configuration.

**Scope:**

- Playwright config: auto-start frontend + Worker
- Root scripts: `dev:e2e` command for full stack
- `.env.example` files with local dev values
- Documentation for running e2e tests locally

**Out of scope:**

- CI/CD pipeline configuration
- Docker/Supabase setup documentation
