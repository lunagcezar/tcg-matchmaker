# Plan — spec-081 Future Event Scheduling Window

Maps spec requirements to concrete tasks. TDD: tests first (RED), then implementation (GREEN).

## Technical Decisions

| #   | Decision                                                                                                                             | Spec req         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| D1  | `MAX_EVENT_HORIZON_MS` added to `packages/shared/src/constants.ts` (365 days), consumed by the schema refine and the frontend helper | REQ-001          |
| D2  | `CreateEventSchema.superRefine` validates `scheduled_at` (future + ≤ horizon) with the two documented messages                       | REQ-002, REQ-003 |
| D3  | `updateEventById` applies the same checks when `scheduled_at` is in the body                                                         | REQ-004          |
| D4  | Worker create tests use dynamic future dates (`Date.now() + offsets`) so they don't rot                                              | GUD-002          |
| D5  | Frontend: pure `scheduledAtError` in `src/lib/eventSchedule.ts`; `DateTimePicker` appends a combined rule + defaults date to today   | REQ-006..009     |
| D6  | Rule messages localized via `event.inFuture`/`event.tooFar`; helper returns codes only                                               | GUD-003          |

## Task List

### T1 — Shared constant

- `packages/shared/src/constants.ts`: add `MAX_EVENT_HORIZON_MS`.

### T2 — Shared schema refine (GREEN by itself)

- `packages/shared/src/schemas/event.ts`: `superRefine` on `scheduled_at`.

### T3 — Worker events tests (RED)

- Update `creates a match and returns 201` body → future `scheduled_at`.
- Add: past → 400; beyond horizon → 400.
- Add `PATCH /api/events/:id` test: owner + past `scheduled_at` → 400; future → 200/ok.
- Run → RED (current create returns 201 for past; no update validation).

### T4 — Worker update validation (GREEN)

- `events/service.ts` `updateEventById`: reject past/too-far `scheduled_at`.

### T5 — Worker tournaments test (RED→GREEN)

- Update `creates a tournament and returns 201` body → future date; add past → 400 test (covered by shared schema once T2 lands).

### T6 — `src/lib/eventSchedule.ts` (TDD)

- RED: `src/lib/__tests__/eventSchedule.test.ts` (past/too_far/null/null/null + boundary).
- GREEN: implement helper.

### T7 — `DateTimePicker.vue` (TDD)

- RED: spec tests for default-today (`modelValue: ''` → date = today local, time empty) and combined rule (past → `event.inFuture`, beyond → `event.tooFar`, valid → true).
- GREEN: default-today in the prop watch; `combinedRule` appended to both inputs; `useI18n`.

### T8 — i18n keys

- `event.inFuture` / `event.tooFar` in `en-US` + `pt-BR`.

### T9 — Verification & docs

- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check`.
- Grep: no fixed past dates in worker create tests.
- Update `CHANGELOG.md`.
- Commit: `feat(frontend,worker): enforce future event scheduling window (spec-081)`.
