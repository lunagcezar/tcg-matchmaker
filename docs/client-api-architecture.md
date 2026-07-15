# Client API Architecture

## Overview

All API calls from the frontend go through **Hono RPC** (`hono/client`), providing end-to-end type safety from the Worker routes to the browser. Raw `fetch()` calls are not used for API communication — the typed Hono client is the single entry point.

```
Browser → getClient() → hc<AppType>() → fetch() → Worker
                ↓
         Fully typed: request params + response body are inferred from Worker route definitions
```

---

## Setup

The Hono client is created once and cached:

```ts
// src/composables/useApi.ts
import { hc } from 'hono/client';
import type { AppType } from '@tcg/worker';

type Client = ReturnType<typeof hc<AppType>>;

let cachedClient: Client | null = null;

export function getClient(): Client {
  if (!cachedClient) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
    cachedClient = hc<AppType>(baseUrl);
  }
  return cachedClient;
}
```

The `AppType` is the exported type from the Worker (`packages/worker/src/index.ts`):

```ts
export type AppType = typeof app;
```

---

## Usage Patterns

### GET requests

```ts
import { getClient } from '@/composables/useApi';

// No params
const res = await getClient().api.events.$get();
const body = await res.json();
// body is typed as { data: Event[], error: string | null, meta: null }

// With path params
const res = await getClient().api.events[':id'].$get({ param: { id: '123' } });

// With query params
const res = await getClient().api.events.$get({ query: { type: 'match', status: 'open' } });
```

### POST requests

```ts
// With JSON body
const res = await getClient().api.events.$post({
  json: { type: 'match', lat: -3.7, lng: -38.5, scheduled_at: '2026-07-20T10:00:00Z' },
});
```

### POST without body (actions)

```ts
// Join event
const res = await getClient().api.events[':id'].join.$post({ param: { id: '123' } });

// Publish tournament
const res = await getClient().api.tournaments[':id'].publish.$post({ param: { id: '456' } });
```

### PATCH / PUT requests

```ts
const res = await getClient().api.stores[':id'].$patch({
  param: { id: '123' },
  json: { name: 'New Name', phone: '85999999999' },
});
```

### DELETE requests

```ts
const res = await getClient().api.tcgs[':id'].$delete({ param: { id: '123' } });
```

### Routes with hyphens in path

Use bracket notation for segments containing hyphens:

```ts
// GET /api/notifications/unread-count
const res = await getClient().api.notifications['unread-count'].$get();

// POST /api/verify-turnstile
const res = await getClient().api['verify-turnstile'].$post({ json: { token } });

// POST /api/tournaments/:id/check-in
const res = await getClient().api.tournaments[':id']['check-in'].$post({
  param: { id: '123' },
  json: { user_id: '456' },
});

// GET /api/admin/audit-log
const res = await getClient().api.admin['audit-log'].$get();
```

### Nested routes

```ts
// GET /api/events/:id/participants
const res = await getClient().api.events[':id'].participants.$get({ param: { id: '123' } });

// GET /api/stores/:id/members
const res = await getClient().api.stores[':id'].members.$get({ param: { id: '123' } });

// GET /api/tournaments/:id/bracket
const res = await getClient().api.tournaments[':id'].bracket.$get({ param: { id: '123' } });

// GET /api/tcgs/:id/formats
const res = await getClient().api.tcgs[':id'].formats.$get({ param: { id: '123' } });

// POST /api/admin/users/:id/ban
const res = await getClient().api.admin.users[':id'].ban.$post({ param: { id: '123' } });
```

### Sending headers

```ts
// Per-request headers (second argument)
const res = await getClient().api.events.$get(
  { query: { type: 'match' } },
  { headers: { 'X-Custom': 'value' } },
);
```

### Error handling

The Hono client returns a standard `Response` object. Check `res.ok` or `res.status` for errors:

```ts
const res = await getClient().api.events[':id'].$get({ param: { id: '123' } });
if (res.ok) {
  const body = await res.json();
  return body.data;
} else {
  const body = await res.json();
  console.error(body.error);
  return null;
}
```

All Worker routes return `{ data: T | null, error: string | null, meta: null }`, so the response body always follows this shape regardless of status code.

---

## Path-to-Client Mapping Reference

| Worker Route                             | Hono Client Call                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `GET /api/events`                        | `getClient().api.events.$get()`                                                     |
| `GET /api/events/:id`                    | `getClient().api.events[':id'].$get({ param: { id } })`                             |
| `POST /api/events`                       | `getClient().api.events.$post({ json })`                                            |
| `POST /api/events/:id/join`              | `getClient().api.events[':id'].join.$post({ param: { id } })`                       |
| `POST /api/events/:id/confirm`           | `getClient().api.events[':id'].confirm.$post({ param: { id } })`                    |
| `POST /api/events/:id/decline`           | `getClient().api.events[':id'].decline.$post({ param: { id } })`                    |
| `GET /api/events/:id/participants`       | `getClient().api.events[':id'].participants.$get({ param: { id } })`                |
| `GET /api/stores`                        | `getClient().api.stores.$get()`                                                     |
| `GET /api/stores/:id`                    | `getClient().api.stores[':id'].$get({ param: { id } })`                             |
| `POST /api/stores`                       | `getClient().api.stores.$post({ json })`                                            |
| `PATCH /api/stores/:id`                  | `getClient().api.stores[':id'].$patch({ param: { id }, json })`                     |
| `DELETE /api/stores/:id`                 | `getClient().api.stores[':id'].$delete({ param: { id } })`                          |
| `POST /api/stores/:id/verify`            | `getClient().api.stores[':id'].verify.$post({ param: { id } })`                     |
| `POST /api/stores/:id/suspend`           | `getClient().api.stores[':id'].suspend.$post({ param: { id }, json })`              |
| `GET /api/stores/:id/members`            | `getClient().api.stores[':id'].members.$get({ param: { id } })`                     |
| `GET /api/tcgs`                          | `getClient().api.tcgs.$get()`                                                       |
| `POST /api/tcgs`                         | `getClient().api.tcgs.$post({ json })`                                              |
| `DELETE /api/tcgs/:id`                   | `getClient().api.tcgs[':id'].$delete({ param: { id } })`                            |
| `GET /api/tcgs/:id/formats`              | `getClient().api.tcgs[':id'].formats.$get({ param: { id } })`                       |
| `POST /api/tcgs/:id/formats`             | `getClient().api.tcgs[':id'].formats.$post({ param: { id }, json })`                |
| `GET /api/tournaments`                   | `getClient().api.tournaments.$get()`                                                |
| `GET /api/tournaments/:id`               | `getClient().api.tournaments[':id'].$get({ param: { id } })`                        |
| `POST /api/tournaments`                  | `getClient().api.tournaments.$post({ json })`                                       |
| `POST /api/tournaments/:id/register`     | `getClient().api.tournaments[':id'].register.$post({ param: { id } })`              |
| `POST /api/tournaments/:id/publish`      | `getClient().api.tournaments[':id'].publish.$post({ param: { id } })`               |
| `POST /api/tournaments/:id/start`        | `getClient().api.tournaments[':id'].start.$post({ param: { id } })`                 |
| `POST /api/tournaments/:id/check-in`     | `getClient().api.tournaments[':id']['check-in'].$post({ param: { id }, json })`     |
| `GET /api/tournaments/:id/bracket`       | `getClient().api.tournaments[':id'].bracket.$get({ param: { id } })`                |
| `POST /api/bracket-matches/:id/report`   | `getClient().api['bracket-matches'][':id'].report.$post({ param: { id }, json })`   |
| `POST /api/bracket-matches/:id/walkover` | `getClient().api['bracket-matches'][':id'].walkover.$post({ param: { id }, json })` |
| `GET /api/auth/me`                       | `getClient().api.auth.me.$get()`                                                    |
| `PATCH /api/auth/profile`                | `getClient().api.auth.profile.$patch({ json })`                                     |
| `POST /api/auth/suspend`                 | `getClient().api.auth.suspend.$post()`                                              |
| `POST /api/auth/export`                  | `getClient().api.auth.export.$post()`                                               |
| `DELETE /api/auth/account`               | `getClient().api.auth.account.$delete()`                                            |
| `GET /api/auth/onboarding`               | `getClient().api.auth.onboarding.$get()`                                            |
| `POST /api/auth/onboarding`              | `getClient().api.auth.onboarding.$post({ json })`                                   |
| `GET /api/geocode/search`                | `getClient().api.geocode.search.$get({ query })`                                    |
| `GET /api/notifications`                 | `getClient().api.notifications.$get()`                                              |
| `GET /api/notifications/unread-count`    | `getClient().api.notifications['unread-count'].$get()`                              |
| `PATCH /api/notifications/:id/read`      | `getClient().api.notifications[':id'].read.$patch({ param: { id } })`               |
| `POST /api/notifications/read-all`       | `getClient().api.notifications['read-all'].$post()`                                 |
| `POST /api/push-subscriptions`           | `getClient().api['push-subscriptions'].$post({ json })`                             |
| `DELETE /api/push-subscriptions/:id`     | `getClient().api['push-subscriptions'][':id'].$delete({ param: { id } })`           |
| `GET /api/reports`                       | `getClient().api.reports.$get()`                                                    |
| `PATCH /api/reports/:id`                 | `getClient().api.reports[':id'].$patch({ param: { id }, json })`                    |
| `GET /api/admin/audit-log`               | `getClient().api.admin['audit-log'].$get()`                                         |
| `POST /api/admin/users/:id/ban`          | `getClient().api.admin.users[':id'].ban.$post({ param: { id } })`                   |
| `POST /api/admin/users/:id/unban`        | `getClient().api.admin.users[':id'].unban.$post({ param: { id } })`                 |
| `POST /api/admin/users/:id/promote`      | `getClient().api.admin.users[':id'].promote.$post({ param: { id } })`               |
| `POST /api/verify-turnstile`             | `getClient().api['verify-turnstile'].$post({ json })`                               |

---

## Shared Utilities (`src/lib/`)

The `src/lib/` directory contains pure utility functions used across pages and components:

| File            | Exports                                                                                                                         | Purpose                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `lib/api.ts`    | `getApiBase()`                                                                                                                  | Returns API base URL (used only by `useApi.ts`) |
| `lib/format.ts` | `formatDate()`, `relativeTime()`                                                                                                | Date/time formatting                            |
| `lib/colors.ts` | `badgeColor()`, `statusColor()`, `roleColor()`, `eventColor()`, `memberRoleColor()`, `matchStatusColor()`, `notificationIcon()` | Color mapping for status badges                 |
| `lib/router.ts` | `eventRoute()`                                                                                                                  | Builds route paths for event types              |

These are plain functions with no Vue reactivity — import and use directly:

```ts
import { formatDate } from '@/lib/format';
import { badgeColor } from '@/lib/colors';
import { eventRoute } from '@/lib/router';

// Usage in templates:
// {{ formatDate(event.scheduled_at) }}
// :color="badgeColor(event.status)"
// :to="eventRoute(event)"
```
