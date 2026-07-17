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

## 3. Additional Requirements

- **REQ-006**: LocationAutocomplete molecule replaces raw lat/lng inputs in create forms — uses Nominatim geocoding via Worker proxy
- **REQ-007**: Admin user list fetches all users (not just current user); ban/unban/promote require confirmation dialog
- **REQ-008**: TCG create form is a standalone page using AppCard, not a dialog
- **REQ-009**: AdminPageHeader supports `action-to` prop for navigation links

## 4. Implementation Changes

### Worker: Add admin user list and delete endpoints

- `GET /api/admin/users` — returns all non-deleted users (id, username, email, role, banned_at, created_at)
- `DELETE /api/admin/users/:id` — soft-deletes a user (sets deleted_at), logs audit

### Frontend: Remove SiteBranch chevron

Revert the chevron expansion icon; parent items render as flat links just like items without children. Children expand with indentation only when the route is active.

### Frontend: Fix QDate+QTime alignment

Wrap QDate and QTime in `<div class="row items-start no-wrap">` so they sit side-by-side inside the popup.

### Frontend: useGeocode composable

New composable that searches via `GET /api/geocode/search?q=...` and returns Nominatim results.

### Frontend: LocationAutocomplete molecule

QSelect with `use-input` and `@filter`, debounced geocode search, emits `(lat, lng, displayName)` on selection.

### Frontend: CreatePages — address autocomplete

Replace lat/lng inputs with `<LocationAutocomplete>` in all three create forms. lat/lng are filled from selection, address stored as `custom_location_name`.

### Frontend: Fix UserListPage

- Use `GET /api/admin/users` instead of `/api/auth/me` to list all users
- Add confirmation dialogs for ban, unban, and promote actions
- Add typed interface for user rows

### Frontend: TcgCreatePage

New standalone page at `/admin/tcgs/create` using AppCard. TcgListPage links to it via AdminPageHeader `action-to` prop; removes AdminFormDialog and unused form state.

### Frontend: AdminPageHeader `action-to` prop

When `action-to` is provided, the action button becomes a router-link instead of emitting `action`.

## 5. Implementation (original)

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
