# Plan — spec-079 DateTimePicker Timezone Round-Trip + Loop Fix

Maps spec requirements to concrete tasks. TDD: regression tests first (RED), then the component fix (GREEN).

## Technical Decisions

| #   | Decision                                                                                                                                                                 | Spec req         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| D1  | Pin `process.env.TZ = 'America/Fortaleza'` at the top of `DateTimePicker.spec.ts` (same pattern as `useFormatDate.spec.ts:1`); Vitest `forks` pool isolates env per file | GUD-002          |
| D2  | Fix read path: `new Date(modelValue)` → extract **local** parts (`getFullYear/Month/Date/Hours/Minutes`)                                                                 | REQ-001          |
| D3  | Fix write path: `new Date('YYYY-MM-DDTHH:mm')` (local) → `.toISOString()` (UTC)                                                                                          | REQ-002          |
| D4  | Loop-safe guard: emit only when `iso.slice(0,16) !== props.modelValue.slice(0,16)` (minute granularity)                                                                  | REQ-003, CON-002 |
| D5  | Replace two separate `watch(date)`/`watch(time)` with a single `watch([date, time])` (one emit per change)                                                               | REQ-005          |
| D6  | Keep empty/invalid → `''` behavior                                                                                                                                       | REQ-004          |

## Task List

### T1 — Plan (this file)

### T2 — DateTimePicker.spec.ts (RED)

- Set `process.env.TZ = 'America/Fortaleza'` on line 1.
- Correct the TZ-dependent assertion in `sets initial date and time from modelValue`: `'2026-07-24T14:30:00.000Z'` now displays `'11:30'` (14:30Z − 3h) instead of `'14:30'`.
- Add regression test `displays the local date and time for a UTC modelValue` (AC-001): `'2026-07-24T17:30:00.000Z'` → date `'2026-07-24'`, time `'14:30'`.
- Add regression test `round-trips through local time without recursive emission` (AC-003): mount → edit time to `'16:45'` → assert emitted ISO is `new Date('2026-07-24T16:45').toISOString()` → `setProps({ modelValue: iso })` → assert time input still `'16:45'` and no additional emit.
- Run → new tests fail (old `split('T')` shows `'17:30'`, round-trip emits a shifted value).

### T3 — DateTimePicker.vue (GREEN)

- Add `toLocalParts(value)` and `toIso(datePart, timePart)` helpers.
- Rewrite `parseModelValue` → `toLocalParts`; `updateModelValue` → `toIso` + minute-level guard.
- Replace the two watches with `watch([date, time], updateModelValue)`.
- Run → all spec tests pass.

### T4 — Verification & docs

- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check`.
- Update `CHANGELOG.md`.
- Commit: `fix(frontend): correct DateTimePicker timezone round-trip and update loop (spec-079)`.
