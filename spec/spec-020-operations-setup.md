---
title: Operations Setup — KV Bindings, Sentry, Turnstile
version: 1.0
date_created: 2026-07-14
tags: operations, kv, sentry, turnstile, deployment
---

# Introduction

This specification configures the remaining operational infrastructure: KV namespace bindings for geocoding/rate-limiting, Sentry error tracking, Turnstile CAPTCHA on signup, and environment variable documentation.

## 1. Purpose & Scope

**Purpose:** Complete the operations configuration for production deployment readiness.

**Scope:**

- KV namespace bindings in wrangler.jsonc (GEOCODING_KV, RATE_LIMIT_KV)
- Secrets and environment variables documentation
- Sentry integration in Worker onError handler
- Turnstile CAPTCHA on frontend signup form + Worker verification endpoint
- Wrangler config with proper environment settings

**Out of scope:**

- Actual deployment
- CI/CD pipeline configuration
