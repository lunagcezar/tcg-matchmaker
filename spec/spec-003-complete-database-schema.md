---
title: Complete Database Schema — Remaining Tables & Domain Schemas
version: 1.0
date_created: 2026-07-14
tags: database, migration, schema, data
---

# Introduction

This specification adds the remaining database tables from `docs/data-model.md` that were not included in spec-001, plus their corresponding Zod schemas in the shared package. This completes the data layer so subsequent specs can implement feature APIs against a full schema.

## 1. Purpose & Scope

**Purpose:** Create the second Supabase migration with all remaining entities (TCGs, Formats, Stores, Events, Brackets, Notifications, Reports, Audit Log) and their shared-package Zod schemas.

**Scope:**

- SQL migration `20260714000001_complete_schema.sql` with 11 new tables
- Zod schema files in `@tcg/shared` for each domain
- RLS enabled on all tables with no policies (Hono bypasses via secret key)

**Out of scope:**

- API routes and handlers (covered by subsequent specs)
- Database indexes beyond PKs and FKs (added as needed in feature specs)
- Frontend components or pages

## 2. Tables to Add

| #   | Table                | Domain        | Dependencies                      |
| --- | -------------------- | ------------- | --------------------------------- |
| 1   | `tcgs`               | TCGs          | None                              |
| 2   | `formats`            | Formats       | tcgs                              |
| 3   | `game_stores`        | Stores        | users (created_by_user_id)        |
| 4   | `store_memberships`  | Stores        | game_stores, users                |
| 5   | `events`             | Events        | users, tcgs, formats, game_stores |
| 6   | `event_participants` | Events        | events, users                     |
| 7   | `bracket_rounds`     | Tournaments   | events                            |
| 8   | `bracket_matches`    | Tournaments   | bracket_rounds, users             |
| 9   | `notifications`      | Notifications | users                             |
| 10  | `push_subscriptions` | Notifications | users                             |
| 11  | `reports`            | Moderation    | users                             |
| 12  | `audit_log`          | Moderation    | users                             |

## 3. Requirements, Constraints & Guidelines

### SQL Migration

- **DB-001**: All tables must use `IF NOT EXISTS` for idempotency.
- **DB-002**: All tables must have `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- **DB-003**: All tables must have `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- **DB-004**: Soft-deletable tables must have `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` and `deleted_at TIMESTAMPTZ`.
- **DB-005**: All foreign keys must use `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate.
- **DB-006**: RLS must be enabled on all tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- **DB-007**: Store memberships must have a unique constraint on `(store_id, user_id)`.
- **DB-008**: Store owners must be enforced via a partial unique index: `CREATE UNIQUE INDEX ... ON store_memberships (store_id) WHERE role = 'owner'`.
- **DB-009**: Events must have a CHECK constraint ensuring exactly one of `organizer_user_id` / `organizer_store_id` is non-null.
- **DB-010**: Status columns on events, event_participants, bracket_matches, and reports must use TEXT with CHECK constraints (not native enums, for migration simplicity).
- **DB-011**: The migration filename must use the next timestamp: `20260714000001_complete_schema.sql`.

### Shared Zod Schemas

- **SCH-001**: Create standalone schema files per domain in `packages/shared/src/schemas/`.
- **SCH-002**: Each schema file must export both the Zod schema and derived TypeScript types.
- **SCH-003**: Update `packages/shared/src/index.ts` to re-export all new schemas.
- **SCH-004**: Initial schemas must include all columns from the data model. Later specs can add refinements.
- **SCH-005**: All `id` fields use `z.string().uuid()`. Timestamps use `z.string().datetime()`. Nullable fields use `.nullable()`.

### Schema Files to Create

| File                      | Exports                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `schemas/tcg.ts`          | `TcgSchema`, `CreateTcgSchema`, `Tcg`                                                     |
| `schemas/store.ts`        | `StoreSchema`, `StoreMembershipSchema`, `CreateStoreSchema`, `Store`, `StoreMembership`   |
| `schemas/event.ts`        | `EventSchema`, `EventParticipantSchema`, `CreateEventSchema`, `Event`, `EventParticipant` |
| `schemas/tournament.ts`   | `BracketRoundSchema`, `BracketMatchSchema`, `BracketRound`, `BracketMatch`                |
| `schemas/notification.ts` | `NotificationSchema`, `PushSubscriptionSchema`, `Notification`, `PushSubscription`        |
| `schemas/report.ts`       | `ReportSchema`, `Report`                                                                  |

## 4. Acceptance Criteria

- **AC-001**: Migration SQL runs without errors against an empty database.
- **AC-002**: All 12 tables exist after migration (tcgs, formats, game_stores, store_memberships, events, event_participants, bracket_rounds, bracket_matches, notifications, push_subscriptions, reports, audit_log).
- **AC-003**: RLS is enabled on all tables.
- **AC-004**: Foreign key constraints reference correct tables with correct ON DELETE behavior.
- **AC-005**: `pnpm -F @tcg/shared exec tsc --noEmit` passes.
- **AC-006**: `pnpm -F @tcg/worker exec tsc --noEmit` passes (ensures compatibility).
- **AC-007**: `pnpm -F @tcg/frontend exec quasar build` passes (ensures frontend compatibility).

## 5. Test Automation Strategy

- **Test Levels**: Migration verification (SQL correctness)
- **Frameworks**: Manual review of migration SQL, automated via `supabase db diff` in CI
- **Coverage**: Every column from `docs/data-model.md` must be present in the migration

## 6. Rationale & Context

- **Single large migration vs multiple small migrations**: A single migration is cleaner for the initial schema because all tables are empty and there are no data migration concerns. Future feature specs will add their own targeted migrations.
- **TEXT with CHECK constraints vs native enums**: Supabase (Postgres) supports both. TEXT + CHECK is simpler for migration scripts and avoids enum type management overhead. The CHECK constraints ensure data integrity at the database level.
- **No RLS policies yet**: Hono bypasses RLS via the secret key. Policies will be added as defense-in-depth in a later spec.
- **Separate schema files per domain**: Following the worker's domain-driven design, each domain gets its own schema file. This keeps files focused and makes it easy to find the schema for a given feature.

## 7. Dependencies & External Integrations

### External Systems

- **EXT-001**: Supabase (PostgreSQL) — target for the migration.

### Infrastructure Dependencies

- **INF-001**: Supabase CLI — required to apply migrations via `supabase db push` or `supabase migration up`.

## 8. Related Specifications / Further Reading

- `docs/data-model.md` — Complete entity definitions with column types and constraints
- `spec/spec-001-project-infrastructure.md` — Initial migration (users + consents)
- `AGENTS.md` — Development methodology and conventions
