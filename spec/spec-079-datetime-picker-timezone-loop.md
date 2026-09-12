---
title: Fix DateTimePicker Timezone Round-Trip and Recursive Update Loop
version: 1.0
date_created: 2026-09-11
tags: frontend, bug, dates, timezone, forms
---

# Introduction

Editing the time in any create form (match, tournament, trading) corrupts the scheduled date/time: the displayed time jumps to a different value, and once the date rolls past midnight the date itself shifts. After the first edit, typing in any other form field re-triggers the corruption. The browser console reports `Maximum recursive updates exceeded in component <QForm>`, indicating a reactive effect that mutates its own dependencies. The root cause is in the `DateTimePicker` molecule: it mixes **local** input (`type="date"` / `type="time"`) with **UTC** ISO storage without a consistent timezone conversion, so each parse→emit round-trip adds the UTC offset and never converges — producing both the wrong displayed time/date and an unbounded update loop.

## 1. Purpose & Scope

Fix `DateTimePicker.vue` so that (a) the displayed date/time are the **local** representation of the stored UTC ISO value, (b) the emitted value is the **UTC ISO** of the local input, and (c) the parse→emit round-trip is stable (no spurious emission, no recursion). Add regression tests that reproduce the bug under a non-UTC timezone.

**In scope**

| Artifact                                                    | Change                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/molecules/DateTimePicker.vue`               | Replace raw `split('T')` parsing and unconditional `toISOString()` emission with consistent local↔UTC conversion and a loop-safe emit guard |
| `src/components/molecules/__tests__/DateTimePicker.spec.ts` | Pin `process.env.TZ` to a non-UTC zone; correct the TZ-dependent assertion; add round-trip + recursion regression tests                     |

**Out of scope**

- Changing the storage/API contract: `events.scheduled_at` stays an ISO-8601 UTC string; the Worker is untouched.
- The other `toISOString()` uses in `NotificationPage.vue`, `SettingsPage.vue`, and `useNotificationStore.ts` (unrelated: current-timestamp filenames/read-state, no local/UTC mixing).
- Adding a dedicated date/time utility in `src/lib/` — the conversion is small and component-local; if a second consumer appears, extract it (per spec-077 DRY guidelines).
- Luxon migration of `DateTimePicker` (the project already uses `useFormatDate` for display, but this input needs plain `Date` math; Luxon's `IsoDateTime` is a possible future improvement).

## 2. Definitions

- **UTC ISO**: An ISO-8601 string with a `Z` suffix, e.g. `2026-07-24T17:30:00.000Z`. This is what `modelValue`/`scheduled_at` carry and what the API stores.
- **Local input**: The `type="date"` and `type="time"` HTML inputs, which express wall-clock date/time in the browser's local timezone with minute precision (no `Z`).
- **Round-trip**: `modelValue → parse → local refs → emit → parent v-model → modelValue`. Stability requires `toLocalParts(toIso(local)) === local`.
- **Recursive update loop**: `props.modelValue` changes → parse writes the local refs → local-ref watcher emits a _different_ ISO → parent writes the prop → parse writes local refs again → … until Vue aborts with `Maximum recursive updates exceeded`.

## 3. Requirements, Constraints & Guidelines

### Behavior

- **REQ-001**: Given a UTC ISO `modelValue`, the date/time inputs shall show the **local** calendar date and wall-clock time of that instant (e.g., `2026-07-24T17:30:00.000Z` in a UTC-3 timezone shows date `2026-07-24`, time `14:30`).
- **REQ-002**: Given date/time input values, the emitted `update:modelValue` shall be the UTC ISO of that local instant (e.g., local `2026-07-24T14:30` in UTC-3 emits `2026-07-24T17:30:00.000Z`).
- **REQ-003**: The round-trip shall be stable: when the parent writes the emitted value back to `modelValue`, the component shall not emit again (minute-granularity equality) and the displayed local values shall equal what the user typed.
- **REQ-004**: Clearing either input emits `''`; an invalid date/time combination emits `''` (current behavior preserved).
- **REQ-005**: The component shall never enter the recursive update loop — a mount with a non-empty `modelValue` and a subsequent user edit must not produce cascading emissions or `Maximum recursive updates exceeded` warnings.

### Constraints & guidelines

- **CON-001**: Do not change the `modelValue` contract (UTC ISO string) or the emitted type.
- **CON-002**: Minute-precision semantics: the HTML inputs only carry `HH:mm`, so comparisons and round-trips are evaluated at minute granularity; trailing seconds/milliseconds in `modelValue` are not a source of loops (they do not trigger re-emission).
- **CON-003**: No production `any` types; `strict` TS stays on.
- **GUD-001**: Follow TDD — write the regression tests first (RED: they must fail with the current component), then fix (GREEN).
- **GUD-002**: The regression tests must run under a **non-UTC** timezone (e.g., `process.env.TZ = 'America/Fortaleza'`), because the bug is invisible at offset 0. The spec file pins TZ at the top (same pattern as `useFormatDate.spec.ts:1`); Vitest's default `forks` pool isolates `process.env` per file.
- **GUD-003**: Keep the fix minimal and component-local; do not refactor unrelated code.

## 4. Interfaces & Data Contracts

### Component (unchanged public interface)

```ts
// src/components/molecules/DateTimePicker.vue
interface Props {
  modelValue: string; // UTC ISO, e.g. '2026-07-24T17:30:00.000Z'
  label?: string;
  rules?: ((v: string) => true | string)[];
}
// emits: (e: 'update:modelValue', value: string)  — UTC ISO, or '' when incomplete/invalid
```

### Internal helpers (proposed)

```ts
// UTC ISO → local date/time parts (minute precision)
function toLocalParts(value: string): { date: string; time: string } {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '' };
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  const h = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  return { date: `${y}-${m}-${d}`, time: `${h}:${min}` };
}

// local date/time → UTC ISO, or '' when invalid
function toIso(datePart: string, timePart: string): string {
  const combined = new Date(`${datePart}T${timePart}`); // local, no Z
  return Number.isNaN(combined.getTime()) ? '' : combined.toISOString();
}
```

### Watchers (proposed)

```ts
watch(
  () => props.modelValue,
  (value) => {
    const parts = toLocalParts(value);
    date.value = parts.date;
    time.value = parts.time;
  },
  { immediate: true },
);

watch([date, time], () => {
  if (!date.value || !time.value) {
    emit('update:modelValue', '');
    return;
  }
  const iso = toIso(date.value, time.value);
  // loop-safe guard: only emit when the minute-level value actually changed
  if (iso && iso.slice(0, 16) !== props.modelValue.slice(0, 16)) {
    emit('update:modelValue', iso);
  }
});
```

## 5. Acceptance Criteria

- **AC-001**: Given `process.env.TZ = 'America/Fortaleza'` (UTC-3) and `modelValue = '2026-07-24T17:30:00.000Z'`, When the component mounts, Then the date input shows `2026-07-24` and the time input shows `14:30`.
- **AC-002**: Given a UTC-3 environment, local inputs `2026-07-24` + `14:30`, When the user edits the time input, Then the last emitted value is `new Date('2026-07-24T14:30').toISOString()` (`2026-07-24T17:30:00.000Z`).
- **AC-003**: Given the component mounted with `modelValue = '2026-07-24T17:30:00.000Z'` in UTC-3, When the parent writes the component's emitted value back via `setProps({ modelValue })`, Then the displayed values stay at `2026-07-24` / `14:30` and **no additional `update:modelValue` emission occurs** (loop broken).
- **AC-004**: Given either input cleared, When updated, Then `update:modelValue` emits `''`.
- **AC-005**: Given an invalid combination (e.g. date `not-a-date` with a valid time), When updated, Then `update:modelValue` emits `''`.
- **AC-006**: Given the fix, When the full suite runs under a non-UTC timezone, Then no test emits `Maximum recursive updates exceeded` warnings and `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` all pass.

## 6. Test Automation Strategy

- **Test Levels**: Component tests (Vitest + `@vue/test-utils` `mount`) on `DateTimePicker.vue`.
- **Frameworks**: Vitest; existing spec at `src/components/molecules/__tests__/DateTimePicker.spec.ts` stubs `q-input` and mounts directly.
- **Environment pinning**: `process.env.TZ = 'America/Fortaleza'` (UTC-3) at the top of the spec file so the offset bug is reproducible; Vitest `forks` pool isolates the env per file (same convention as `useFormatDate.spec.ts`).
- **Actions (TDD order)**:
  - RED: add the regression tests (AC-001 display, AC-003 round-trip stability) and correct the existing TZ-dependent assertion (`sets initial date and time from modelValue`); run → confirm they fail with the current component (AC-003 reproduces the loop via `setProps`).
  - GREEN: implement `toLocalParts`/`toIso` and the loop-safe watcher in `DateTimePicker.vue`; run → all pass.
  - Keep AC-002 (emit ISO), AC-004 (clear → `''`), AC-005 (invalid → `''`) green.
- **Test Data Management**: use the UTC-3 example values from §5; the emitted ISO is computed with `new Date('2026-07-24T14:30').toISOString()` so the expectation is TZ-correct by construction.
- **CI/CD Integration**: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` in the pre-push pipeline (unchanged).
- **Coverage Requirements**: keep `pnpm test:coverage` thresholds unchanged.

## 7. Rationale & Context

### Root cause

`DateTimePicker.vue` does two things that are individually fine but together corrupt the value:

1. `parseModelValue` slices the raw ISO string (`value.split('T')`) and feeds the **UTC** wall-clock time directly into the local `type="time"` input — so a stored `14:30Z` is displayed as `14:30` even though local time is `11:30` (UTC-3). Near midnight this shifts the **date** too (e.g., `23:30Z` displays as `23:30` local → user's stored instant is actually `20:30` local the same day, but a naive round-trip can roll the date).
2. `updateModelValue` builds a local `Date` from the input and calls `.toISOString()` (UTC). Because the display was fed UTC-as-local, the emitted ISO is always the displayed value **plus** the offset. The guard `iso !== props.modelValue` therefore never converges, so each parse re-writes the local refs, each write re-emits, the parent `v-model` feeds a new prop back, and Vue aborts with `Maximum recursive updates exceeded in component <QForm>`. This also explains the "typing in any other field changes the date and time" symptom: the runaway loop keeps mutating `scheduled_at` on every re-render.

### Fix

Use consistent conversions in both directions:

- **Read**: `new Date(modelValue)` (the instant) → extract local `getFullYear/getMonth/getDate/getHours/getMinutes` → display.
- **Write**: `new Date('YYYY-MM-DDTHH:mm')` (local) → `.toISOString()` (UTC) → emit.

This makes the round-trip an involution (`toLocalParts(toIso(local)) === local`), so the loop-safe guard `iso.slice(0, 16) !== props.modelValue.slice(0, 16)` terminates after one pass. Minute-granularity comparison matches the inputs' precision and avoids normalizing away trailing seconds on mount.

### Why test under a non-UTC timezone

At offset 0 the old code is accidentally stable (the emitted ISO equals the prop), so a UTC test suite cannot see the bug. Pinning `TZ=America/Fortaleza` (the project's primary market) makes the regression deterministic.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: None — no Supabase/Worker/DB changes; `scheduled_at` contract unchanged.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: Existing `events.scheduled_at` timestamptz values (ISO UTC strings); no schema change.

### Technology Platform Dependencies

- **PLT-001**: Vue 3 `ref`/`watch`, native `<input type="date|time">`, Vitest `forks` pool, Node full-icu timezone data (`America/Fortaleza`).

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

### Reproduced (current behavior, UTC-3)

```
modelValue = '2026-07-24T17:30:00.000Z'
  → parseModelValue slices → time shows '17:30' (wrong, should be 14:30)
  → user types time '14:30' → toISOString = '2026-07-24T17:30:00.000Z'
  → guard compares to prop '17:30...' → equal? no (original prop was '17:30:00Z'?) — actually the prop at that moment is '17:30Z', emitted is '17:30Z' → equal, no emit? No — the prop is still the original '17:30Z' and emitted is '17:30Z' → no emit, but the displayed time is now 14:30 while the stored value says 17:30Z (14:30 local) — mismatched. Typing a second time emits '20:30Z', prop updates, parse shows '20:30'... diverges → loop.
```

### Fixed (UTC-3)

```
modelValue = '2026-07-24T17:30:00.000Z'
  → toLocalParts → date '2026-07-24', time '14:30'  (correct local display)
  → user types time '16:45' → toIso → '2026-07-24T19:45:00.000Z' (correct UTC)
  → parent writes it back → toLocalParts → '2026-07-24' '16:45' → minute compare equal → no emit → stable
```

Edge cases:

- **Midnight rollover**: stored `2026-07-25T01:30:00.000Z` in UTC-3 displays as `2026-07-24` `22:30` local — correct, no date corruption.
- **Value with seconds**: `modelValue = '2026-07-24T17:30:45.000Z'` displays `14:30`; minute-granularity guard means it does not re-emit on mount and is only normalized if the user edits.
- **Empty/invalid**: empty or NaN inputs produce `''` (AC-004/AC-005), matching current behavior.
- **DST transitions**: `toLocalParts(toIso(local))` is stable within a given instant; non-existent local times (DST spring-forward) are an accepted platform-level edge and not addressed here (Brazil has no DST).

## 10. Validation Criteria

- `pnpm test` passes — new regression tests (RED→GREEN) and the full suite with no `Maximum recursive updates` warnings.
- `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` pass.
- `DateTimePicker.spec.ts` runs pinned to a non-UTC timezone and the fixed conversion assertions hold.
- `CHANGELOG.md` notes the fix.

## 11. Related Specifications / Further Reading

- `spec-078-event-name-standardization.md` — the create forms that consume `DateTimePicker`
- `spec-077-frontend-page-refactor.md` — `useFormSubmit` used by these forms; DRY conventions
- `docs/requirements.md` — NFR-28d (all dates via `useFormatDate`; this input remains a native input)
- `spec-063-tree-date-feedback.md` — prior date/UX work
- MDN `Date`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
- ICU time zones / Node `process.env.TZ`: https://nodejs.org/api/util.html#util_custom_inspect_function_on_objects
