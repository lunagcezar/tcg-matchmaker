---
title: Admin Tree Indentation, Date Picker, and Profile Feedback Fixes
version: 1.0
date_created: 2026-07-16
tags: design, ux, frontend
---

# Introduction

Fix three UX regressions: admin sidebar tree indentation (CSS specificity breaks nested padding), missing inline error feedback on profile username save, and native datetime-local inputs not using Quasar's QDate+QTime popup.

## 1. Requirements

- **REQ-001**: Admin nav children shall be indented with left border and padding visible on both mobile drawer and desktop sidebar
- **REQ-002**: Parent nav items with children shall show an expand/collapse chevron icon
- **REQ-003**: Profile username save in SettingsPage shall show the API error message inline (same pattern as password tab)
- **REQ-004**: Date/time inputs in match, trading, and tournament create forms shall use QDate+QTime popup instead of native datetime-local
- **REQ-005**: Scheduled_at value sent to API must be a valid ISO 8601 datetime string (`z.string().datetime()`)

## 2. Acceptance Criteria

- **AC-001**: Given an admin user on any admin subpage, When viewing the sidebar, Then child nav items appear indented with a visual left border
- **AC-002**: Given a parent nav node with children, When the sidebar renders, Then a chevron icon indicates it is expandable
- **AC-003**: Given a profile update that returns an API error (e.g., username taken), When the user clicks save, Then the error message appears inline below the save button
- **AC-004**: Given any create form (match/trading/tournament), When the user clicks the date field, Then a QDate+QTime popup appears instead of a native date picker
- **AC-005**: Given a scheduled_at selected via QDate+QTime, When the form is submitted, Then the API receives a valid ISO datetime string

## 3. Implementation

### Fix 1: CSS specificity

`app.scss` lines 297-302 use `.app-sidebar__scroll ul, .app-mobile-drawer ul` with `padding: 0; margin: 0` (specificity 0,1,0,1) which overrides `.app-nav-children` padding-left/margin-left (specificity 0,1,0,0). Fix by qualifying the children selector.

Add a chevron icon in SiteBranch before the router-link for parent nodes.

### Fix 2: Inline error in SettingsPage

Add `profileMessage`/`profileError` refs. Replace the catch block with response.error check. Show inline `<p>` below the save button mirroring the password tab pattern.

### Fix 3: QDate+QTime popup

Replace `<q-input type="datetime-local">` with:

```vue
<q-input v-model="form.scheduled_at" label="Date & Time" outlined>
  <template v-slot:append>
    <q-icon name="event" class="cursor-pointer">
      <q-popup-proxy>
        <q-date v-model="form.scheduled_at" mask="YYYY-MM-DD HH:mm" />
        <q-time v-model="form.scheduled_at" mask="YYYY-MM-DD HH:mm" now-button />
      </q-popup-proxy>
    </q-icon>
  </template>
</q-input>
```

Convert to ISO in save function:

```ts
async function save() {
  saving.value = true;
  error.value = '';
  try {
    await store.create({
      type: 'match',
      ...form,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      max_participants: Number(form.max_participants),
    });
    void router.push('/matches');
  } catch {
    error.value = 'Failed to create match';
  } finally {
    saving.value = false;
  }
}
```
