# Plan — spec-003: Complete Database Schema

## Summary

Add the second migration with all remaining tables from the data model, plus corresponding Zod schemas in the shared package. This unblocks all feature API specs.

## Implementation Order

```
         ┌──────────────────────┐
         │  Shared Zod schemas  │  (1) Create schema files per domain
         │  (no deps)           │      tcg.ts, store.ts, event.ts,
         │                      │      tournament.ts, notification.ts, report.ts
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  SQL Migration       │  (2) 20260714000001_complete_schema.sql
         │  (references schema) │      11 tables with RLS, FKs, CHECK constraints
         └──────────────────────┘
```

## Parallelizable Blocks

| Block | Items | Dependencies |
|-------|-------|-------------|
| A | Shared schema files (6 files) | None |
| B | SQL migration | None (references data-model.md only) |

Both blocks are independent and can run in parallel.

## Concrete File List

### New files

| File | Purpose |
|------|---------|
| `packages/shared/src/schemas/tcg.ts` | TcgSchema, CreateTcgSchema, types |
| `packages/shared/src/schemas/store.ts` | StoreSchema, StoreMembershipSchema, CreateStoreSchema, types |
| `packages/shared/src/schemas/event.ts` | EventSchema, EventParticipantSchema, CreateEventSchema, types |
| `packages/shared/src/schemas/tournament.ts` | BracketRoundSchema, BracketMatchSchema, types |
| `packages/shared/src/schemas/notification.ts` | NotificationSchema, PushSubscriptionSchema, types |
| `packages/shared/src/schemas/report.ts` | ReportSchema, types |
| `supabase/migrations/20260714000001_complete_schema.sql` | All 12 tables |

### Modified files

| File | Change |
|------|--------|
| `packages/shared/src/index.ts` | Add exports for all new schema files |

## Acceptance Criteria Check

| AC | How to verify |
|----|--------------|
| AC-001 | Review SQL for correctness |
| AC-002 | Each table name is present in the migration |
| AC-003 | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for each table |
| AC-004 | FK constraints use correct ON DELETE behavior |
| AC-005 | `pnpm -F @tcg/shared exec tsc --noEmit` |
| AC-006 | `pnpm -F @tcg/worker exec tsc --noEmit` |
| AC-007 | `pnpm -F @tcg/frontend exec quasar build` |
