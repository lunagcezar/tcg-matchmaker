---
title: Logger Middleware — Structured Logging with Sentry & LGPD Sanitization
version: 1.0
date_created: 2026-07-14
tags: middleware, logging, sentry, observability
---

# Introduction

This specification adds a centralized structured logger to the Worker. It supports multiple log levels, pluggable transports (console, Sentry), and automatically sanitizes personal data before sending to Sentry for LGPD compliance.

## 1. Purpose & Scope

**Purpose:** Implement a structured logger with console and Sentry transports, LGPD sanitization, and level-based filtering.

**Scope:**

- Logger class/function with levels: debug, info, warn, error, critical
- Console transport (always active)
- Sentry transport (when DSN is configured)
- LGPD sanitization: replaces email, name, username, phone with `[SANITIZED]`
- Pluggable transport interface
- Integration into the Worker's onError handler

**Out of scope:**

- Frontend logger (separate spec)
- Sentry setup/deployment (requires DSN configuration)

## 2. Logger API

```typescript
logger.info('User created', { userId: 'abc' });
logger.error('Failed to process', { error: err, userId: 'abc' });
logger.critical('Database unreachable', { error: err });
```

Levels: `debug` (dev only), `info`, `warn`, `error`, `critical` (always logs stack traces)

## 3. Sanitization Rules

| Field                           | Sanitized to      |
| ------------------------------- | ----------------- |
| `email`                         | `[SANITIZED]`     |
| `name`                          | `[SANITIZED]`     |
| `display_name`                  | `[SANITIZED]`     |
| `username`                      | `[SANITIZED]`     |
| `phone`                         | `[SANITIZED]`     |
| `password`                      | stripped entirely |
| `token`                         | stripped entirely |
| IDs, counts, status, timestamps | Preserved         |

## 4. Acceptance Criteria

- **AC-001**: Logger outputs messages at the correct level.
- **AC-002**: Logger sanitizes personal fields before sending to Sentry.
- **AC-003**: `debug` messages are suppressed when not in development.
- **AC-004**: `critical` always logs stack traces.
- **AC-005**: All 55 existing tests still pass.
