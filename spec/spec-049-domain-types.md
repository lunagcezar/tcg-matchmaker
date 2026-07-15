---
title: Domain Types from Shared Zod Schemas
version: 1.0
date_created: 2026-07-15
tags: frontend, types, refactoring
---

# Domain Types

## 1. Purpose & Scope

Replace pervasive `Record<string, string>` and `Record<string, unknown>` casts across the frontend with proper TypeScript types derived from the shared Zod schemas in `@tcg/shared`.

## 2. Changes

### Created `src/types/domain.ts`

Re-exports inferred types from `@tcg/shared`:

```ts
export type {
  Event,
  EventParticipant,
  Store,
  StoreMembership,
  Notification,
  Report,
  BracketRound,
  BracketMatch,
  User,
  UserResponse,
};
```

### Updated Stores

| Store                  | Before                                                                         | After                                         |
| ---------------------- | ------------------------------------------------------------------------------ | --------------------------------------------- |
| `useEventStore`        | `items: Record<string, unknown>[]`, `current: Record<string, unknown> \| null` | `items: Event[]`, `current: Event \| null`    |
| `useStoreStore`        | `items: Record<string, unknown>[]`, `current: Record<string, unknown> \| null` | `items: Store[]`, `current: Store \| null`    |
| `useNotificationStore` | Local `Notification` interface                                                 | Shared `Notification` type from `@tcg/shared` |

### Updated Pages

Removed `as Record<string, string>` casts from 10+ pages (ProfilePage, matches/_, trading/_, tournaments/_, stores/_, IndexPage). Where local interfaces (`MatchDetails`, `MatchListItem`, `TradingSession`) differ from the full `Event` schema, casts now go through `unknown` first: `as unknown as MatchDetails`.

## 3. Acceptance Criteria

- **AC-001**: `vue-tsc --noEmit` passes with 0 frontend TypeScript errors
- **AC-002**: `pnpm test` passes (64 worker + 35 frontend)
- **AC-003**: All stores use domain types instead of `Record<string, unknown>`
- **AC-004**: No `as Record<string, string>` casts remain in page files
