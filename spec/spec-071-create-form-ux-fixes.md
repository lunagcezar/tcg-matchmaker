---
title: Create Form UX Fixes — Native Date Inputs, Validation, and Error Styling
version: 1.0
date_created: 2026-07-24
tags: ux, frontend, forms, validation
---

# Introduction

Fix create-form UX regressions: the Quasar QDate+QTime popup DateTimePicker caused crashes and inconsistent behavior; required fields did not highlight in red; the max-participants field had extra spacing on the match create form; and the location autocomplete did not participate in form validation.

## 1. Purpose & Scope

This specification covers the create forms for matches, trading sessions, tournaments, and stores. It defines the expected behavior of the date/time input, required-field validation, error highlighting, and consistent field spacing.

## 2. Definitions

- **Native date/time inputs**: Standard HTML `<input type="date">` and `<input type="time">` rendered through Quasar `q-input` with matching `outlined` styling.
- **Q-form validation**: Quasar's `<q-form>` component with `ref` and `validate()` method, used to evaluate all `:rules` before submission.
- **Error highlighting**: Quasar's `q-field--error` state, which colors the label, underline, and bottom message red when a rule fails.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Date and time inputs shall use native `type="date"` and `type="time"` `q-input` fields styled consistently with other form fields (`outlined`, `dense`).
- **REQ-002**: The DateTimePicker molecule shall combine the two native inputs into a single ISO 8601 datetime string emitted via `v-model`.
- **REQ-003**: The popup-based QDate+QTime implementation shall be removed because it caused runtime crashes.
- **REQ-004**: All create forms shall be wrapped in `<q-form>` and call `validate()` before submitting.
- **REQ-005**: All required fields (scheduled date/time, location, name, max participants, store city/state) shall have `:rules` that display a red error when invalid.
- **REQ-006**: The error red color shall be visible in both light and dark modes using the existing `--destructive` token.
- **REQ-007**: The match create form's max-participants field shall not have extra bottom spacing; the `:hint` shall be removed.
- **REQ-008**: LocationAutocomplete shall support `v-model` and `:rules` so it participates in `q-form` validation.

## 4. Interfaces & Data Contracts

### DateTimePicker props

```ts
interface DateTimePickerProps {
  modelValue: string; // ISO 8601 datetime or empty
  label?: string;
  rules?: ((v: string) => true | string)[];
}
```

### LocationAutocomplete props

```ts
interface LocationAutocompleteProps {
  modelValue?: string;
  label: string;
  rules?: ((v: string) => true | string)[];
}
```

Events: `select(lat, lng, displayName, city?, state?, country?)`, `update:modelValue(value: string)`.

## 5. Acceptance Criteria

- **AC-001**: Given the match create form, When the user clicks the date field, Then a native date picker appears instead of a Quasar popup.
- **AC-002**: Given the tournament create form, When the user submits with empty date/time, Then the date/time fields turn red and display "Date and time are required".
- **AC-003**: Given the store create form, When the user submits without selecting a location, Then the location field turns red and the form does not call the API.
- **AC-004**: Given the match create form, When the user views the max-participants field, Then its vertical spacing matches the other fields.
- **AC-005**: Given dark mode, When a field has a validation error, Then the error message and underline are clearly visible (light red on dark background).

## 6. Test Automation Strategy

- **Unit**: Update `DateTimePicker.spec.ts` to assert two native inputs, initial value parsing, and ISO emission on change.
- **Integration**: Worker tests already verify the `CreateEventSchema` rejects empty `scheduled_at` and `max_participants < 2`.
- **Manual**: Verify red error states in light and dark themes across all create forms.

## 7. Rationale & Context

The QDate+QTime popup implementation required `q-popup-proxy` target management, which caused `vue-tsc` errors and runtime crashes when the target selector contained invalid characters. Native inputs are simpler, enforce valid dates via the browser, and match the visual style of other Quasar outlined fields.

Wrapping forms in `<q-form>` ensures that all `:rules` are evaluated on submit, giving users immediate visual feedback and preventing invalid API calls.

## 8. Dependencies & External Integrations

- **PLT-001**: Quasar form components (`q-form`, `q-input`, `q-select`, `q-btn`) must be available.
- **PLT-002**: Vue 3 Composition API with `ref`/`reactive`/`watch`.

## 9. Examples & Edge Cases

### DateTimePicker usage

```vue
<DateTimePicker
  v-model="form.scheduled_at"
  :label="$t('event.scheduledAt')"
  :rules="[(v) => !!v || 'Date and time are required']"
/>
```

### Form validation wrapper

```vue
<q-form ref="formRef" class="q-gutter-md" @submit.prevent="save">
  <q-input v-model="form.name" :rules="[(v) => !!v || 'Name is required']" />
  <q-btn type="submit" label="Save" />
</q-form>
```

## 10. Validation Criteria

- `pnpm lint` passes.
- `pnpm test` passes (frontend and worker).
- Manual verification of native date/time pickers and red error states in both themes.

## 11. Related Specifications / Further Reading

- `spec-063-tree-date-feedback.md` — prior date picker feedback fixes
- `spec-070-audit-remediation-p1.md` — frontend DRY and quality guidelines
- `spec-069-audit-remediation-p0.md` — worker DRY and quality guidelines
