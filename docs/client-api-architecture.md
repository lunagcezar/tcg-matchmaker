# Client API Architecture

## Overview

All API calls from the frontend go through four typed fetch wrapper functions in `src/composables/useApi.ts`. These functions provide a consistent interface for HTTP requests while keeping type safety through explicit type assertions at the call site.

```
Browser → apiGet('/api/events') → fetch() → Worker
          apiPost('/api/events')
          apiPatch('/api/stores/:id')
          apiDelete('/api/tcgs/:id')
```

---

## Setup

The API functions are simple wrappers around `fetch()`:

```ts
// src/composables/useApi.ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  return res.json() as unknown as { data: unknown; error: string | null; meta: null };
}

export async function apiPost(path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    ...(body !== undefined
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  });
  return res.json() as unknown as { data: unknown; error: string | null; meta: null };
}

export async function apiPatch(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json() as unknown as { data: unknown; error: string | null; meta: null };
}

export async function apiDelete(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  return res.json() as unknown as { data: unknown; error: string | null; meta: null };
}
```

All responses follow the shape `{ data: T | null, error: string | null, meta: null }`. Use type assertions when assigning:

```ts
const j = await apiGet('/api/events');
items.value = (j.data ?? []) as Record<string, unknown>[];
```

---

## Usage Patterns

### GET requests

```ts
import { apiGet } from '@/composables/useApi';

// List
const j = await apiGet('/api/events');
const events = (j.data ?? []) as Record<string, unknown>[];

// Single item
const j = await apiGet(`/api/events/${id}`);
const event = j.data as Record<string, unknown> | null;

// With query params
const j = await apiGet(`/api/events?type=match&status=open`);
```

### POST requests

```ts
import { apiPost } from '@/composables/useApi';

// With JSON body
const j = await apiPost('/api/events', { type: 'match', lat: -3.7, lng: -38.5 });

// Without body (action endpoints)
const j = await apiPost(`/api/events/${id}/join`);
```

### PATCH requests

```ts
const j = await apiPatch(`/api/stores/${id}`, { name: 'New Name' });
```

### DELETE requests

```ts
const j = await apiDelete(`/api/tcgs/${id}`);
```

---

## State Management

API calls are organized in two layers:

### Pinia Stores (shared global state)

| Store                  | State                                     | Methods                                                                                                             |
| ---------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `useEventStore`        | `items`, `loading`, `current`             | `list`, `get`, `create`, `join`, `confirm`, `decline`                                                               |
| `useStoreStore`        | `items`, `loading`, `current`             | `list`, `get`, `create`, `update`, `getMembers`                                                                     |
| `useAuthStore`         | `user`, `loading`                         | `signUp`, `signIn`, `signOut`, `restoreSession`, `checkOnboarding`                                                  |
| `useAppStore`          | `locale`, `darkMode`                      | `setLocale`, `toggleDarkMode`                                                                                       |
| `useNotificationStore` | `notifications`, `unreadCount`, `loading` | `fetchNotifications`, `fetchUnreadCount`, `markAsRead`, `markAllAsRead`, `subscribeRealtime`, `unsubscribeRealtime` |

### Stateless Composables (no shared state)

| Composable             | Purpose                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `useApi`               | Low-level `apiGet/Post/Patch/Delete` functions                    |
| `useAdminStore`        | Pure API functions for admin CRUD (fetchStore, verifyStore, etc.) |
| `useAccountManagement` | Pure API functions for account actions (delete, suspend, export)  |
| `useBracketD3`         | D3 bracket SVG rendering                                          |
| `usePageMeta`          | SEO meta tag injection                                            |

---

## Shared Utilities (`src/lib/`)

| File                   | Exports                                                                                                                         | Purpose                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `lib/api.ts`           | `getApiBase()`                                                                                                                  | Returns API base URL                       |
| `lib/format.ts`        | (deprecated) Date formatting moved to `useFormatDate`                                                                           | Historical date helpers                    |
| `lib/colors.ts`        | `badgeColor()`, `statusColor()`, `roleColor()`, `eventColor()`, `memberRoleColor()`, `matchStatusColor()`, `notificationIcon()` | Color mapping for status badges            |
| `lib/router.ts`        | `eventRoute()`                                                                                                                  | Builds route paths for event types         |
| `lib/injectionKeys.ts` | `MapListScrollRefKey` and other layout-provided refs                                                                            | Provide/inject keys for shared layout refs |

```ts
import { useFormatDate } from '@/composables/useFormatDate';
import { badgeColor } from '@/lib/colors';
import { eventRoute } from '@/lib/router';
```

### Date formatting

Use the `useFormatDate` composable (Luxon-based) for every displayed date or time:

```ts
const { formatDate, formatTime, formatDateTime, formatRelative } = useFormatDate();
```

Do not call `new Date().toLocaleDateString()` or `toLocaleTimeString()` directly.

---

## Path Reference

| Method | Path                                | Function Call                                               |
| ------ | ----------------------------------- | ----------------------------------------------------------- |
| GET    | `/api/events`                       | `apiGet('/api/events')`                                     |
| GET    | `/api/events/:id`                   | `apiGet(\`/api/events/${id}\`)`                             |
| POST   | `/api/events`                       | `apiPost('/api/events', data)`                              |
| POST   | `/api/events/:id/join`              | `apiPost(\`/api/events/${id}/join\`)`                       |
| POST   | `/api/events/:id/confirm`           | `apiPost(\`/api/events/${id}/confirm\`)`                    |
| POST   | `/api/events/:id/decline`           | `apiPost(\`/api/events/${id}/decline\`)`                    |
| GET    | `/api/events/:id/participants`      | `apiGet(\`/api/events/${id}/participants\`)`                |
| GET    | `/api/stores`                       | `apiGet('/api/stores')`                                     |
| GET    | `/api/stores/:id`                   | `apiGet(\`/api/stores/${id}\`)`                             |
| POST   | `/api/stores`                       | `apiPost('/api/stores', data)`                              |
| PATCH  | `/api/stores/:id`                   | `apiPatch(\`/api/stores/${id}\`, data)`                     |
| DELETE | `/api/stores/:id`                   | `apiDelete(\`/api/stores/${id}\`)`                          |
| POST   | `/api/stores/:id/verify`            | `apiPost(\`/api/stores/${id}/verify\`)`                     |
| POST   | `/api/stores/:id/suspend`           | `apiPost(\`/api/stores/${id}/suspend\`, { reason })`        |
| GET    | `/api/stores/:id/members`           | `apiGet(\`/api/stores/${id}/members\`)`                     |
| GET    | `/api/tcgs`                         | `apiGet('/api/tcgs')`                                       |
| POST   | `/api/tcgs`                         | `apiPost('/api/tcgs', data)`                                |
| DELETE | `/api/tcgs/:id`                     | `apiDelete(\`/api/tcgs/${id}\`)`                            |
| GET    | `/api/tcgs/:id/formats`             | `apiGet(\`/api/tcgs/${id}/formats\`)`                       |
| POST   | `/api/tcgs/:id/formats`             | `apiPost(\`/api/tcgs/${id}/formats\`, data)`                |
| GET    | `/api/tournaments`                  | `apiGet('/api/tournaments')`                                |
| GET    | `/api/tournaments/:id`              | `apiGet(\`/api/tournaments/${id}\`)`                        |
| POST   | `/api/tournaments`                  | `apiPost('/api/tournaments', data)`                         |
| POST   | `/api/tournaments/:id/register`     | `apiPost(\`/api/tournaments/${id}/register\`)`              |
| POST   | `/api/tournaments/:id/publish`      | `apiPost(\`/api/tournaments/${id}/publish\`)`               |
| POST   | `/api/tournaments/:id/start`        | `apiPost(\`/api/tournaments/${id}/start\`)`                 |
| POST   | `/api/tournaments/:id/check-in`     | `apiPost(\`/api/tournaments/${id}/check-in\`, { user_id })` |
| GET    | `/api/tournaments/:id/bracket`      | `apiGet(\`/api/tournaments/${id}/bracket\`)`                |
| POST   | `/api/bracket-matches/:id/report`   | `apiPost(\`/api/bracket-matches/${id}/report\`, data)`      |
| POST   | `/api/bracket-matches/:id/walkover` | `apiPost(\`/api/bracket-matches/${id}/walkover\`, data)`    |
| GET    | `/api/auth/me`                      | `apiGet('/api/auth/me')`                                    |
| PATCH  | `/api/auth/profile`                 | `apiPatch('/api/auth/profile', data)`                       |
| POST   | `/api/auth/suspend`                 | `apiPost('/api/auth/suspend')`                              |
| POST   | `/api/auth/export`                  | `apiPost('/api/auth/export')`                               |
| DELETE | `/api/auth/account`                 | `apiDelete('/api/auth/account')`                            |
| GET    | `/api/auth/onboarding`              | `apiGet('/api/auth/onboarding')`                            |
| POST   | `/api/auth/onboarding`              | `apiPost('/api/auth/onboarding', data)`                     |
| GET    | `/api/geocode/search`               | `apiGet(\`/api/geocode/search?q=${q}\`)`                    |
| GET    | `/api/notifications`                | `apiGet('/api/notifications')`                              |
| GET    | `/api/notifications/unread-count`   | `apiGet('/api/notifications/unread-count')`                 |
| PATCH  | `/api/notifications/:id/read`       | `apiPatch(\`/api/notifications/${id}/read\`, {})`           |
| POST   | `/api/notifications/read-all`       | `apiPost('/api/notifications/read-all')`                    |
| GET    | `/api/reports`                      | `apiGet('/api/reports')`                                    |
| PATCH  | `/api/reports/:id`                  | `apiPatch(\`/api/reports/${id}\`, data)`                    |
| GET    | `/api/admin/audit-log`              | `apiGet('/api/admin/audit-log')`                            |
| POST   | `/api/admin/users/:id/ban`          | `apiPost(\`/api/admin/users/${id}/ban\`)`                   |
| POST   | `/api/admin/users/:id/unban`        | `apiPost(\`/api/admin/users/${id}/unban\`)`                 |
| POST   | `/api/admin/users/:id/promote`      | `apiPost(\`/api/admin/users/${id}/promote\`)`               |
| POST   | `/api/verify-turnstile`             | `apiPost('/api/verify-turnstile', { token })`               |
