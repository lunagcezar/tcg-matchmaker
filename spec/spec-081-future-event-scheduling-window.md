---
title: Enforce Future Event Scheduling Window (Now < scheduled_at ≤ 1 Year)
version: 1.0
date_created: 2026-09-11
tags: frontend, worker, validation, events, ux
---

# Introduction

Events (matches, tournaments, trading sessions) can currently be scheduled at any time: in the past or arbitrarily far in the future. This spec enforces that every event can only happen **in the future** and **no more than 1 year ahead**, validated on both the frontend (inline UX feedback on the `DateTimePicker`) and the Worker (authoritative). It also improves the create-form UX so the date input defaults to today while the time stays blank.

## 1. Purpose & Scope

Enforce `now < scheduled_at ≤ now + 1 year` on event create (and reschedule) for both Worker and frontend, and default the event form's date field to today.

**In scope**

| Artifact                                              | Change                                                                                                                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/constants.ts`                    | Add `MAX_EVENT_HORIZON_MS = 365 * 24 * 60 * 60 * 1000` (1 year ≈ 365 days)                                                                                                                              |
| `packages/shared/src/schemas/event.ts`                | `CreateEventSchema` gains a `superRefine`: `scheduled_at` must be strictly in the future and within `MAX_EVENT_HORIZON_MS`                                                                              |
| `packages/worker/src/events/service.ts`               | `updateEventById` rejects a `scheduled_at` that is in the past or beyond the horizon                                                                                                                    |
| `src/lib/eventSchedule.ts` (frontend)                 | New pure helper `scheduledAtError(iso, now)` → `'in_past' \| 'too_far' \| null` (single source of the rule message mapping)                                                                             |
| `src/components/molecules/DateTimePicker.vue`         | (a) default the date input to today's local date when `modelValue` is empty, leaving time blank; (b) append an internal combined rule (future + ≤1yr, localized) to both inputs                         |
| `src/i18n/en-US/index.ts` + `src/i18n/pt-BR/index.ts` | Add `event.inFuture` ('Event date must be in the future' / 'A data do evento deve ser no futuro') and `event.tooFar` ('Event date must be within 1 year' / 'A data do evento deve ser dentro de 1 ano') |
| Frontend + worker tests                               | Update create tests to future dates; add past/too-far rejection tests; add `eventSchedule` unit tests and DateTimePicker UX/rule tests                                                                  |

**Out of scope**

- Backfill validation of **existing** events already stored with a past `scheduled_at` (historical/completed events remain as-is; GET/list are unaffected).
- Cancelling/past-event display changes.
- Calendar-year semantics for "1 year" (using a fixed 365-day constant; documented).
- Recurring events or an event-edit UI (none exists today; the update validation covers the API path only).

## 2. Definitions

- **Scheduling window**: `now < scheduled_at ≤ now + MAX_EVENT_HORIZON_MS`.
- **`scheduled_at`**: the UTC ISO timestamp of an event (`events.scheduled_at`, `timestamptz`). Create forms carry it as `form.scheduled_at`, produced by `DateTimePicker`.
- **Account of `now`**: `Date.now()` evaluated at validation time (Worker) or render time (frontend rule).
- **Combined value**: in `DateTimePicker`, the UTC ISO produced from the local date+time inputs via `toIso(date, time)`; empty until both are filled.

## 3. Requirements, Constraints & Guidelines

### Shared schema / Worker (authoritative)

- **REQ-001**: `MAX_EVENT_HORIZON_MS` is defined once in `@tcg/shared` and reused by both the Worker schema and the frontend helper.
- **REQ-002**: `CreateEventSchema` shall reject a `scheduled_at` whose instant is `≤ Date.now()` with the message `'Event date must be in the future'`, and reject an instant `> Date.now() + MAX_EVENT_HORIZON_MS` with `'Event date must be within 1 year'`.
- **REQ-003**: The rejection applies to every event type (match, tournament, trading) since all create through `CreateEventSchema` (verified: `events/service.ts:94`, `tournaments/service.ts:44`).
- **REQ-004**: `updateEventById` shall apply the same two checks when the request body includes `scheduled_at`; other update fields are unaffected.
- **REQ-005**: A missing/invalid-format `scheduled_at` is unaffected (existing `z.string().min(1)` and date parsing cover format).

### Frontend

- **REQ-006**: `scheduledAtError(iso, now = Date.now())` returns `'in_past'` when `iso` is `≤ now`, `'too_far'` when `> now + MAX_EVENT_HORIZON_MS`, and `null` otherwise (including empty/invalid `iso` — the existing required rule covers those).
- **REQ-007**: `DateTimePicker` appends an internal rule to both inputs: when the combined value is set, it shows `$t('event.inFuture')` / `$t('event.tooFar')` per `scheduledAtError`; it never replaces the parent-provided rules (required, etc.).
- **REQ-008**: When `DateTimePicker.modelValue` is empty on render, the date input shows today's **local** date and the time input stays empty; no value is emitted until the user sets a time (the parent keeps `scheduled_at = ''`).
- **REQ-009**: The future/≤1yr rule is evaluated against the combined local date+time (so a "today + past time" is correctly flagged as `'in_past'`).

### Constraints & guidelines

- **CON-001**: No DB migration; `scheduled_at` stays `timestamptz`.
- **CON-002**: No production `any`; `strict` TS.
- **CON-003**: The frontend and Worker share the horizon constant (`@tcg/shared`) so they cannot drift.
- **GUD-001**: TDD — write tests first (RED), then implement (GREEN).
- **GUD-002**: Worker tests that create events must use **future** `scheduled_at` (dynamic, e.g. `new Date(Date.now() + 86_400_000).toISOString()`) so they don't rot; GET fixtures with past dates stay valid (no validation on read).
- **GUD-003**: The frontend rule's localized message maps from the code returned by `scheduledAtError` (keeps the pure helper locale-agnostic).

## 4. Interfaces & Data Contracts

### Shared constant

```ts
// packages/shared/src/constants.ts
export const MAX_EVENT_HORIZON_MS = 365 * 24 * 60 * 60 * 1000;
```

### Shared schema refinement

```ts
// packages/shared/src/schemas/event.ts
export const CreateEventSchema = z.object({/* existing fields */}).superRefine((data, ctx) => {
  const t = new Date(data.scheduled_at).getTime();
  if (Number.isNaN(t)) return; // format handled by existing rules
  if (t <= Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Event date must be in the future',
      path: ['scheduled_at'],
    });
  } else if (t > Date.now() + MAX_EVENT_HORIZON_MS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Event date must be within 1 year',
      path: ['scheduled_at'],
    });
  }
});
```

### Frontend pure helper

```ts
// src/lib/eventSchedule.ts
import { MAX_EVENT_HORIZON_MS } from '@tcg/shared';

export type ScheduledAtError = 'in_past' | 'too_far' | null;

export function scheduledAtError(iso: string, now: number = Date.now()): ScheduledAtError {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  if (t <= now) return 'in_past';
  if (t > now + MAX_EVENT_HORIZON_MS) return 'too_far';
  return null;
}
```

### DateTimePicker

```ts
// default today when empty
function todayLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      date.value = todayLocalDate();
      time.value = '';
      return;
    }
    const parts = toLocalParts(value);
    date.value = parts.date;
    time.value = parts.time;
  },
  { immediate: true },
);

// internal combined rule (appended to parent rules on both inputs)
const combinedRule = (_value: string): true | string => {
  const err = scheduledAtError(toIso(date.value, time.value));
  if (err === 'in_past') return t('event.inFuture');
  if (err === 'too_far') return t('event.tooFar');
  return true;
};

// inputs get: :rules="[...(rules ?? []), combinedRule]"
```

## 5. Acceptance Criteria

- **AC-001**: Given `CreateEventSchema`, When `scheduled_at` is `Date.now() - 1000`, Then validation fails with `'Event date must be in the future'`.
- **AC-002**: Given `CreateEventSchema`, When `scheduled_at` is `Date.now() + MAX_EVENT_HORIZON_MS + 1000`, Then validation fails with `'Event date must be within 1 year'`.
- **AC-003**: Given `CreateEventSchema`, When `scheduled_at` is `Date.now() + 86_400_000`, Then validation passes.
- **AC-004**: Given `POST /api/events` (any type) with a past `scheduled_at`, When called, Then the response is `400` with the future message; with a valid future date it is `201` (existing test updated to a future date).
- **AC-005**: Given `POST /api/tournaments` with a past `scheduled_at`, When called, Then the response is `400`; with a future date `201`.
- **AC-006**: Given `PATCH /api/events/:id` with a past `scheduled_at`, When called, Then the response is `400`; a future date passes (owner allowed).
- **AC-007**: Given `scheduledAtError`, When `iso` is past / beyond horizon / valid / empty / invalid, Then it returns `'in_past'` / `'too_far'` / `null` / `null` / `null` respectively.
- **AC-008**: Given a `DateTimePicker` mounted with `modelValue: ''`, When rendered, Then the date input equals today's local date and the time input is empty; no `update:modelValue` beyond the initial empty state.
- **AC-009**: Given a `DateTimePicker` with a combined value in the past, When validated, Then the internal rule returns `$t('event.inFuture')`; when beyond the horizon, `$t('event.tooFar')`; when valid, `true`.
- **AC-010**: Given `en-US`/`pt-BR`, When `$t('event.inFuture')` / `$t('event.tooFar')` resolve, Then they return the defined strings in both locales.
- **AC-011**: Given the repository, When `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` run, Then all pass.

## 6. Test Automation Strategy

- **Test Levels**: Worker route tests (Vitest + `createTestApp`); frontend unit tests (`scheduledAtError`) and component tests (`DateTimePicker`).
- **Frameworks**: Vitest; `@cloudflare/vitest-pool-workers` (worker); `@vue/test-utils` (frontend); `@tcg/shared` has no test harness — the schema refinement is exercised through worker routes.
- **Actions (TDD order)**:
  - RED (worker): update the create tests' `scheduled_at` to future dates (dynamic); add past/too-far 400 tests for events, tournaments, and update. Run → the past-date tests fail (currently 201), and the fixed-date create tests would fail after the schema refine (hence dynamic future dates).
  - RED (frontend): `eventSchedule` unit tests; `DateTimePicker` default-today and rule tests. Run → fail (helper/behavior missing).
  - GREEN: shared constant + schema refine; `updateEventById` check; frontend helper; `DateTimePicker` changes; i18n keys.
  - Keep existing `DateTimePicker.spec.ts` assertions green (past-date fixtures only assert input values, not rule output).
- **Test Data Management**: dynamic future dates via `Date.now() + offsets`; horizon boundary tested at `MAX_EVENT_HORIZON_MS ± ε`.
- **CI/CD Integration**: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` in the pre-push pipeline (unchanged).
- **Coverage Requirements**: keep `pnpm test:coverage` thresholds unchanged.

## 7. Rationale & Context

Scheduling a match in the past is a data-quality and trust bug (the platform lists events users must join and attend), and unbounded future dates allow dead/abandoned listings. A shared horizon constant in `@tcg/shared` keeps the Worker (authoritative) and the frontend (UX feedback) aligned.

The frontend rule is deliberately a **combined-value** check inside `DateTimePicker` rather than per-form logic: every event create form uses the molecule, so the rule applies automatically and DRY (per spec-077). The pure `scheduledAtError` helper lives in `src/lib/` (no reactivity) and is unit-testable in isolation; the component only maps its code to a localized message. The default-today UX keeps the event forms one step closer to a valid submission while the required-time rule still forces an explicit time.

The worker validates on create via `CreateEventSchema` (which both the events and tournaments services already use) and on reschedule in `updateEventById`. GET/list are read paths and intentionally not validated, so historical/completed events remain unchanged.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: None — no Supabase/DB changes.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: `events.scheduled_at` (`timestamptz`) — existing column; no schema change.

### Technology Platform Dependencies

- **PLT-001**: Zod (`superRefine`), `@tcg/shared`, Vue 3 `ref`/`watch`, Quasar `q-input` rules, vue-i18n, Vitest.

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

```ts
// Worker rejection (create)
POST /api/events { type: 'match', scheduled_at: '2026-01-01T00:00:00.000Z', lat, lng }
→ 400 { data: null, error: 'Validation failed: Event date must be in the future', meta: null }

// Frontend rule (DateTimePicker, pt-BR)
date = today, time = '10:00' (already past) → rule returns 'A data do evento deve ser no futuro'
date = today + 366 days, time = '12:00'    → rule returns 'A data do evento deve ser dentro de 1 ano'
```

Edge cases:

- **Boundary**: exactly `now` → `'in_past'` (strict `>`); exactly `now + MAX_EVENT_HORIZON_MS` → allowed (≤).
- **Empty/invalid combined value**: `scheduledAtError` returns `null`; the parent's required rule handles emptiness; malformed dates are caught by the existing required rule path.
- **Timezone**: comparisons use instants (`getTime()`), so local date+time in `DateTimePicker` is converted to UTC ISO first — no TZ skew (spec-079 guarantees round-trip stability).
- **Tournament create**: goes through the same `CreateEventSchema`; the bracket fields are unaffected.
- **Existing past events**: untouched (read path); only create/reschedule is validated.
- **Default-today on a cleared field**: if the parent clears `scheduled_at`, the picker re-defaults the date to today (time blank) — consistent, no error.

## 10. Validation Criteria

- `pnpm test` passes — new worker (events/tournaments/update) and frontend (`eventSchedule`, `DateTimePicker`) tests (RED→GREEN) and the full suite.
- `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` pass.
- No fixed past dates remain in worker create tests (grep check); `MAX_EVENT_HORIZON_MS` imported by both `packages/shared` and `src/lib/eventSchedule.ts`.
- `event.inFuture` / `event.tooFar` present in both locales.
- Manual: opening an event create form shows today's date with a blank time; picking a past time or a date >1 year out shows the localized rule message; the Worker returns 400 for past/too-far schedules via API.
- `CHANGELOG.md` notes the change.

## 11. Related Specifications / Further Reading

- `spec-079-datetime-picker-timezone-loop.md` — `DateTimePicker` local↔UTC round-trip that the combined rule relies on
- `spec-078-event-name-standardization.md` / `spec-077-frontend-page-refactor.md` — create forms and `useFormSubmit`
- `docs/requirements.md` — validation and i18n completeness (NFR-28e)
- Zod `superRefine`: https://zod.dev/?id=refine
- `@tcg/shared` constants: `packages/shared/src/constants.ts`
