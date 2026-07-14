---
title: Frontend Foundation — Auth, Routing, Layout & i18n
version: 1.0
date_created: 2026-07-14
tags: frontend, auth, router, layout, i18n
---

# Introduction

This specification completes the frontend foundation: Supabase Auth integration, Pinia stores, router guards, i18n translation files, main layout, and auth pages.

## 1. Purpose & Scope

**Purpose:** Complete the essential frontend infrastructure so that subsequent specs can add feature pages on top of a working foundation.

**Scope:**

- Supabase Auth boot file + client
- `useAuthStore`: signup, login, logout, session restore, onboarding check
- `useAppStore`: theme (dark/light), locale detection + persistence
- Router navigation guards (auth, admin, onboarding)
- i18n en-US and pt-BR with full translation sets
- MainLayout with responsive navigation
- Login and Signup pages
- Home page placeholder
- Env vars wired to `.env.example`

**Out of scope:**

- Feature pages (matches, tournaments, stores, admin) — subsequent specs
- Composables (useMatch, useGeolocation, etc.) — subsequent specs
- Map integration — subsequent spec
