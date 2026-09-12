# Requirements

## 1. User Roles

| Role          | Description                                                              |
| ------------- | ------------------------------------------------------------------------ |
| **Visitor**   | Unauthenticated user — can browse public matches and tournaments         |
| **Player**    | Authenticated user — can create/join matches, participate in tournaments |
| **Organizer** | Player who can create and manage tournaments (user or store manager)     |
| **Admin**     | Manages TCGs/formats, moderates content, bans/unbans users               |

## 2. Functional Requirements

### 2.1 Authentication & Profile

- FR-01: On first deployment, the platform has no users. A dedicated onboarding flow creates the first admin user.
- FR-02: Onboarding page is accessible only while no admin user exists. Once an admin exists, onboarding is never shown again.
- FR-03: Visitor can sign up with email + password (Supabase Auth). Signup form includes Turnstile CAPTCHA.
- FR-04: User can sign in / sign out
- FR-05: User can edit display_name and avatar (JPG, max 2MB)
- FR-06: User can delete their account:
  - Supabase Auth user is permanently deleted immediately
  - `public.users` record is anonymized (display_name → "Deleted User #N", avatar_path → null)
  - All match/tournament history preserved via FK integrity
  - Same email can be used to register a new account later
  - **Exception:** the last remaining admin cannot delete their account
- FR-07: User can download all their personal data as JSON (data portability, LGPD)
- FR-08: User is informed of data processing and consents at signup
- FR-09: User can request account suspension (temporary block)
- FR-10: User profile displays username, display_name, avatar, event history (active + completed)

### 2.2 TCGs & Formats (Admin)

- FR-11: Admin can create, edit, and soft-delete TCGs
- FR-12: Admin can create, edit, and soft-delete Formats under a TCG
- FR-13: Soft-deleted TCGs/Formats are hidden from new match/tournament creation but preserved in existing records (via snapshot)

### 2.3 Game Stores

- FR-14: Any authenticated user can create a game store (name, address, phone, logo, etc.)
- FR-15: Store creator becomes the owner and can add managers and staff
- FR-16: Store owner can transfer ownership to another member
- FR-17: Store owner can add/remove managers; managers can add/remove staff
- FR-18: Store owner and managers can edit store details (name, address, logo, etc.)
- FR-19: Store members (owner/manager/staff) can create events on behalf of the store
- FR-20: Admin can verify a store (`is_verified`) to give it a legitimacy badge
- FR-21: Admin can suspend a store (with reason) — hides it and blocks new events
- FR-22: Admin can soft-delete a store
- FR-23: The store member roster is private — only store members (owner/manager/staff) and admins can list it; the public store detail page exposes a `viewer_role` field so the frontend can hide the members card from non-members

### 2.4 Events — Matches, Tournaments & Trading Sessions

All event types share a unified data model with type-specific behavior.

**Matches** (playing a game):

- FR-23: Player can create a match specifying:
  - TCG, format, date/time
  - Location (existing game store OR custom location with autocomplete geocoding)
  - Max participants (default 2, up to N for Commander/pod play)
  - Whether open to anyone or inviting specific players
  - Organizer: self or one of the user's stores
- FR-24: Player can browse events near their current location (browser Geolocation API) with filters (TCG, format, date range, event type, status)
- FR-25: Events are displayed on a map (Leaflet + OpenStreetMap)
- FR-26: Player can request to join an open match (sets participant status to `pending`)
- FR-27: Player must confirm attendance hours before the match, moving participant status to `confirmed`
- FR-28: Invited player receives notification and can accept or decline a challenge
- FR-29: Match creator can cancel at any time
- FR-30: Match is confirmed when enough participants have status `confirmed`
- FR-31: Players can report match completion and scores
- FR-32: Event history preserved even if participants delete their accounts
- FR-33: Matches support flexible player counts (1v1, 4-player Commander pods, etc.)

**Trading Sessions** (trading cards, not playing):

- FR-34: Player can create a trading session specifying:
  - TCG (optional — null means general trading, any TCG)
  - Date/time and location (store or custom)
  - Description of what they're looking for / offering
  - Max participants (optional)
  - Organizer: self or one of the user's stores
- FR-35: Players can RSVP to a trading session (status `pending`), then confirm attendance
- FR-36: Session creator can edit or cancel their session
- FR-37: Session creator can invite registered users; invited users receive a notification and can accept or decline

**Tournaments** (structured competition):

- FR-38: Organizer (user or store member) can create a tournament with:
  - TCG, format, bracket type, max participants, location, date
  - Organizer: self or one of the user's stores
- FR-39: Players can register for open tournaments (until max_participants reached)
- FR-40: Players must confirm registration before the tournament
- FR-41: Organizer can check in participants before start
- FR-42: Organizer can start the tournament — bracket is generated automatically
- FR-43: Bracket supports: single elimination, double elimination, round robin, swiss, pool play + playoffs (see [Brakto comparison](https://www.brakto.com/blog/tournament-format-comparison))
- FR-44: Players report their match results; organizer can override
- FR-45: Organizer advances winners through rounds
- FR-46: Organizer can mark a bracket match as walkover (W.O.) when a competitor does not attend
- FR-47: Tournament history is preserved after deletion
- FR-48: Organizer can invite registered users; invited users receive a notification and can accept or decline

### 2.5 Event Status Lifecycles

**Match:**

```
open ──(enough confirmed participants)──▶ confirmed
open ──(challenge sent)──▶ challenged ──(accept)──▶ confirmed
confirmed ──(played)──▶ completed
any ──(cancel)──▶ cancelled
```

**Tournament:**

```
draft ──(publish)──▶ open ──(start)──▶ in_progress ──(final match)──▶ completed
any ──(cancel)──▶ cancelled
```

**Trading session:**

```
planned ──(publish)──▶ active ──(date passed)──▶ completed
any ──(cancel)──▶ cancelled
```

### 2.6 Notifications

- FR-49: System sends in-app notifications for event invitations, RSVPs, confirmations, cancellations, bracket advances, and moderation actions
- FR-50: Frontend subscribes to user's notifications via Supabase Realtime and shows an unread badge
- FR-51: User can opt in to browser push notifications (Web Push API); push messages are triggered by the same notification inserts

### 2.7 Moderation (Admin & Community)

- FR-52: Any authenticated user can report a store, user, or event for impersonation, abuse, or incorrect information
- FR-53: Admin reviews reports and can resolve or dismiss them
- FR-54: Admin can remove any user's avatar
- FR-55: Admin can ban a user (sets `banned_at`) — banned users cannot create/join events
- FR-56: Admin can unban a user
- FR-57: Admin can suspend a store (sets `status = suspended`)
- FR-58: Admin can soft-delete any event or store (hides from public view)
- FR-59: All moderation actions are logged in Audit Log
- FR-60: Admin can promote another user to admin
- FR-61: Admin role is polymorphic — admins can create stores, tournaments, trading sessions, and matches like any other user

### 2.8 Geocoding, Maps & Geolocation

- FR-62: Address autocomplete — user types a name, gets suggestions with lat/lng + address components (via Nominatim proxied through Hono)
- FR-63: Map view (Leaflet) for browsing events by location
- FR-64: "Find near me" button uses browser Geolocation API to center the map on user's current location
- FR-65: Custom locations are stored with lat/lng for map display
- FR-66: Trading sessions, matches, and tournaments all appear on the same map with distinct markers by type

### 2.9 LGPD Compliance

- FR-67: Data export endpoint returns all user personal data in JSON format (portability)
- FR-68: Consent recorded at signup with timestamp and version of privacy policy
- FR-69: Account suspension option — temporarily blocks account without data deletion
- FR-70: Privacy policy displayed at signup and linked from footer

## 3. Non-Functional Requirements

### 3.1 Performance & Availability

- NFR-01: API runs on Cloudflare Workers (always warm, no cold starts)
- NFR-02: Frontend deployed on Cloudflare Pages (CDN, global edge)
- NFR-03: Geocoding results cached in Cloudflare KV to minimize external API calls
- NFR-04: Supabase Realtime provides live updates for RSVPs, match confirmations, and bracket changes

### 3.2 Security

- NFR-05: All API requests go through Hono Workers (never direct DB access from browser)
- NFR-06: Auth via Supabase Auth JWT, verified in Hono middleware
- NFR-07: Banned users rejected at middleware level
- NFR-08: File upload limited to JPG, max 2MB, validated server-side
- NFR-09: **Turnstile** (Cloudflare, free) CAPTCHA on signup form — blocks automated bot registrations
- NFR-10: Rate limiting in Hono middleware via KV (`packages/worker/src/middleware/rate-limit.ts`):
  - Composite key strategy: authenticated routes use `{userId}:{ip}`, unauthenticated use `{ip}` only
  - This prevents shared IPs (e.g., game store wifi) from blocking legitimate users
  - Applied endpoints:
    - `POST /api/auth/onboarding`: 3 requests per IP per hour (unauthenticated, IP-only key)
    - `DELETE /api/auth/account`: 5 requests per {userId}:{ip} per 15 minutes (authenticated, composite key)
  - Middleware factory: `rateLimitMiddleware(action, maxRequests, windowSeconds, userId?)`
  - KV key format: `ratelimit:{action}:{discriminator}` where discriminator = `{userId}:{ip}` or just `{ip}`
- NFR-11: Account locking — after 5 consecutive failed login attempts, set `locked_until` (15 min) on user record; checked in Hono middleware before any action
- NFR-12: Custom SMTP via **Resend** for transactional emails (prevents Supabase suspension from bounced emails to fake addresses)

### 3.3 Data & Privacy

- NFR-13: Soft deletes on all entities (no hard deletes)
- NFR-14: User deletion permanently removes Supabase Auth user (email erased); public record anonymized ("Deleted User #N") for FK integrity
- NFR-15: TCG/format deletion preserves match/tournament history via snapshot fields
- NFR-16: User consent recorded at signup (timestamp + privacy policy version)
- NFR-17: Data export returns all user personal data in JSON immediately upon request
- NFR-18: RLS enabled on all tables as defense-in-depth (Hono bypasses via secret key)

### 3.4 Internationalization & Theming

- NFR-19: UI in Brazilian Portuguese (pt-BR) and English (en-US)
- NFR-20: Default language detected from `navigator.language` on first visit; user can switch, preference persisted in Pinia + localStorage
- NFR-21: Locations default to Brasil, Ceará, Fortaleza
- NFR-22: Dark/light mode detected from `prefers-color-scheme` system preference; user can toggle, preference persisted

### 3.5 Code Quality

- NFR-23: SOLID and DRY principles
- NFR-24: Stateful logic extracted to composables (`useMatch`, `useAuth`, `useGeolocation`, `useFormatDate`, etc.); DRY is a first-class requirement — logic repeated across two or more pages/components is extracted into `src/composables/` proactively, before duplication lands in pages
- NFR-25: Components organized with atomic design (atoms / molecules / organisms)
- NFR-26: Oxlint + Oxfmt for linting and formatting
- NFR-27: Husky + lint-staged pre-commit hook runs Oxlint + Oxfmt on staged files
- NFR-28: Tests use **Vitest** for all API endpoints, composables, and utility functions
- NFR-28a: Page components must stay ≤ 200 lines; larger pages are split into organisms under `src/components/organisms/<feature>/`
- NFR-28b: Reusable list components — all event feeds use `BaseList` + `EventRow`; no duplicated `.event-row` or `.q-infinite-scroll` wiring
- NFR-28c: Reusable UI primitives — `StatusFilterSegment` for status filters, `StatusBadge` for status labels, `ConfirmDeleteDialog` for destructive actions, `DateTimePicker` for combined date/time inputs
- NFR-28d: All dates and times displayed in the UI are formatted via the `useFormatDate` Luxon composable; no direct `new Date().toLocaleDateString()` or `toLocaleTimeString()` calls
- NFR-28e: All user-facing strings are internationalized via `$t()` or `useI18n()`; keys are added to both `en-US` and `pt-BR` files
- NFR-28f: Worker routes use `c.var.db` (created by `dbClientMiddleware`), response helpers from `src/lib/responses.ts`, and validation via `validate()` from `src/lib/validation.ts` with shared Zod schemas
- NFR-28g: Shared Zod schemas and constants live in `@tcg/shared` and are used by both frontend forms and Worker validation
- NFR-28h: Environment-specific globals (`localStorage`, `navigator`, `window`) are guarded against `undefined` for SSR/test compatibility
- NFR-28i: Reusable data-flow logic lives in composables — pages must reuse the generic composables from `spec-077` (`useCrudResource`, `useFormSubmit`, `useLoadable`, `useParticipants`, `useStoreList`, `useTournamentBracket`) and must not re-implement `save()`/`loadMore`/`loadData`/CRUD-pagination inline; reactive helpers belong in `src/composables/`, never in `src/lib/` (pure functions only) or a `src/services/` folder

### Backend DRY / Worker Quality (P0)

- NFR-29: The secret Supabase client is created exactly once per request by `src/middleware/db.ts` (`dbClientMiddleware`) and attached to `c.var.db`; Worker routers and services read `c.var.db` and do not call `createSecretClient(...)` directly
- NFR-30: All Zod parsing in Worker services uses the shared `validate(schema, body)` helper from `src/lib/validation.ts`; services must not hand-format `parsed.error.issues` into strings
- NFR-31: All Worker HTTP responses use helpers from `src/lib/responses.ts` (`ok`, `created`, `badRequest`, `notFound`, `forbidden`, `unauthorized`, `tooManyRequests`, `serverError`); inline `c.json(...)` response construction is not allowed
- NFR-32: User roles and store-membership roles are referenced through shared `ROLES`/`Role` and `STORE_MEMBERSHIP_ROLES`/`StoreMembershipRole` from `@tcg/shared`; string literals are not allowed for role checks
- NFR-33: Production code must not use the `any` type; use `unknown`, precise types, or Zod schemas instead
- NFR-34: Every bug fix must include a regression test that fails before the fix and passes after

### 3.6 Observability & Error Tracking

- NFR-29: **Sentry** integrated in both frontend (Quasar) and backend (Hono Workers) for error tracking
- NFR-30: Centralized structured logger with pluggable transports (console, Sentry) — same interface used in both frontend and backend
- NFR-31: Logger sanitizes sensitive data before sending to Sentry (LGPD compliance):
  - Personal data (name, email, phone, username): replaced with `[SANITIZED]`
  - Credentials and tokens: always stripped
  - Aggregated/count data (count, status, timestamps): preserved
  - IDs and foreign keys: preserved (needed for debugging)
- NFR-32: Logger supports levels: `debug`, `info`, `warn`, `error`, `critical`
- NFR-33: `debug` level only active in development; `critical` always logs stack traces

### 3.8 SEO & Discoverability

- NFR-34: Semantic HTML5 structure (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`) on all pages
- NFR-35: Unique `<title>` and `<meta name="description">` per page; dynamic for event, store, tournament, trading session, and profile detail pages
- NFR-36: Canonical URL (`<link rel="canonical">`) on every page
- NFR-37: `robots.txt` at root — allow public pages, disallow `/admin/*`, `/settings`, `/matches/new`, `/trading/new`, `/tournaments/new`, and auth routes
- NFR-38: XML sitemap (`/sitemap.xml`) generated automatically and kept up to date
- NFR-39: OpenGraph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) on all public pages, especially event/store detail pages
- NFR-40: Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) on all public pages
- NFR-41: HTML `lang` attribute reflects the active locale (`pt-BR` or `en-US`)
- NFR-42: JSON-LD structured data using Schema.org vocabulary:
  - `Event` for matches, tournaments, and trading sessions
  - `LocalBusiness` for game stores
  - `Organization` for the platform
- NFR-43: SEO uses a hybrid approach:
  - Quasar Meta plugin sets `<title>`, `<meta>`, OpenGraph, Twitter Card, and JSON-LD client-side for normal users and social scrapers that execute JavaScript.
  - Public static routes (`/`, `/login`, `/signup`, `/stores`, legal pages) are prerendered at build time.
  - Public dynamic detail routes (`/matches/:id`, `/trading/:id`, `/tournaments/:id`, `/stores/:id`, `/profile/:username`) are served as a SPA to users, but a Cloudflare Worker (or Pages Function) detects crawler user-agents and returns a minimal HTML shell with the correct meta tags and JSON-LD fetched from the Hono API.

### 3.9 Browsers & Devices

- NFR-44: Responsive design — desktop and mobile via Quasar
- NFR-45: PWA support (installable, offline-capable)
