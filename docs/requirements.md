# Requirements

## 1. User Roles

| Role | Description |
|------|-------------|
| **Visitor** | Unauthenticated user — can browse public matches and tournaments |
| **Player** | Authenticated user — can create/join matches, participate in tournaments |
| **Organizer** | Player who can create and manage tournaments (user or store manager) |
| **Admin** | Manages TCGs/formats, moderates content, bans/unbans users |

## 2. Functional Requirements

### 2.1 Authentication & Profile
- FR-01: Visitor can sign up with email + password (Supabase Auth). Signup form includes Turnstile CAPTCHA.
- FR-02: User can sign in / sign out
- FR-03: User can edit display_name and avatar (JPG, max 2MB)
- FR-04: User can delete their account:
  - Supabase Auth user is permanently deleted immediately
  - `public.users` record is anonymized (display_name → "Deleted User #N", avatar_path → null)
  - All match/tournament history preserved via FK integrity
  - Same email can be used to register a new account later
- FR-05: User can download all their personal data as JSON (data portability, LGPD)
- FR-06: User is informed of data processing and consents at signup
- FR-07: User can request account suspension (temporary block)
- FR-08: User profile displays username, display_name, avatar, match history (active + completed)
- FR-09: Game store manager (organizer role) can link their account to a store

### 2.2 TCGs & Formats (Admin)
- FR-10: Admin can create, edit, and soft-delete TCGs
- FR-11: Admin can create, edit, and soft-delete Formats under a TCG
- FR-12: Soft-deleted TCGs/Formats are hidden from new match/tournament creation but preserved in existing records (via snapshot)

### 2.3 Game Stores (Admin & Organizer)
- FR-13: Any authenticated user can submit a game store registration (name, address, phone, etc.)
- FR-14: Submitted store gets status `pending` — not visible on map until approved
- FR-15: Admin reviews pending stores: approve or reject (with reason)
- FR-16: On approval: store goes live, submitter becomes `managed_by_user_id`
- FR-17: Admin can edit any store's details, logo, or reassign manager
- FR-18: Store manager can edit their store's details (name, address, logo, etc.)
- FR-19: Admin can soft-delete a store

### 2.4 Events — Matches, Tournaments & Trading Sessions

All event types share a unified data model with type-specific behavior.

**Matches** (playing a game):
- FR-20: Player can create a match specifying:
  - TCG, format, date/time
  - Location (existing game store OR custom location with autocomplete geocoding)
  - Max participants (default 2, up to N for Commander/pod play)
  - Whether open to anyone or inviting specific players
- FR-21: Player can browse events near their current location (browser Geolocation API) with filters (TCG, format, date range, event type, status)
- FR-22: Events are displayed on a map (Leaflet + OpenStreetMap)
- FR-23: Player can request to join an open match
- FR-24: Invited player receives notification and can accept or decline
- FR-25: Match creator can cancel at any time
- FR-26: All participants confirm the match after scheduling
- FR-27: Players can report match completion
- FR-28: Event history preserved even if participants delete their accounts
- FR-29: Matches support flexible player counts (1v1, 4-player Commander pods, etc.)

**Trading Sessions** (trading cards, not playing):
- FR-30: Player can create a trading session specifying:
  - TCG (optional — null means general trading, any TCG)
  - Date/time and location (store or custom)
  - Description of what they're looking for / offering
  - Max participants (optional)
- FR-31: Players can RSVP to a trading session
- FR-32: Session creator can edit or cancel their session

**Tournaments** (structured competition):
- FR-30: Organizer can create a tournament with:
  - TCG, format, bracket type, max participants, location, date
- FR-31: Players can register for open tournaments (until max_participants reached)
- FR-32: Organizer can check in participants before start
- FR-33: Organizer can start the tournament — bracket is generated automatically
- FR-34: Bracket supports: single elimination, double elimination, swiss, round robin
- FR-35: Players report their match results; organizer can override
- FR-36: Organizer advances winners through rounds
- FR-37: Tournament history is preserved after deletion

### 2.5 Event Status Lifecycles
**Match:**
```
open ──(player joins)──▶ confirmed
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

### 2.6 Moderation (Admin)
- FR-38: Admin reviews and approves/rejects pending game store registrations
- FR-39: Admin can remove any user's avatar
- FR-40: Admin can ban a user (sets `banned_at`) — banned users cannot create/join events
- FR-41: Admin can unban a user
- FR-42: Admin can soft-delete any event or store (hides from public view)
- FR-43: All moderation actions are logged in Audit Log

### 2.7 Geocoding, Maps & Geolocation
- FR-44: Address autocomplete — user types a name, gets suggestions with lat/lng + address components (via Nominatim proxied through Hono)
- FR-45: Map view (Leaflet) for browsing events by location
- FR-46: "Find near me" button uses browser Geolocation API to center the map on user's current location
- FR-47: Custom locations are stored with lat/lng for map display
- FR-48: Trading sessions and matches both appear on the same map with distinct markers by type

### 2.8 LGPD Compliance
- FR-49: Data export endpoint returns all user personal data in JSON format (portability)
- FR-50: Consent recorded at signup with timestamp and version of privacy policy
- FR-51: Account suspension option — temporarily blocks account without data deletion
- FR-52: Privacy policy displayed at signup and linked from footer

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
- NFR-10: Rate limiting in Hono middleware via KV:
  - Signup: max 3 requests per IP per hour
  - Login: max 5 requests per IP per 15 minutes
  - Password reset: max 3 requests per IP per hour
- NFR-11: Account locking — after 5 consecutive failed login attempts, set `locked_until` (15 min) on user record; checked in Hono middleware before any action
- NFR-12: Custom SMTP via **Resend** for transactional emails (prevents Supabase suspension from bounced emails to fake addresses)

### 3.3 Data & Privacy
- NFR-13: Soft deletes on all entities (no hard deletes)
- NFR-14: User deletion permanently removes Supabase Auth user (email erased); public record anonymized ("Deleted User #N") for FK integrity
- NFR-15: TCG/format deletion preserves match/tournament history via snapshot fields
- NFR-16: User consent recorded at signup (timestamp + privacy policy version)
- NFR-17: Data export returns all user personal data in JSON within 24h
- NFR-18: RLS enabled on all tables as defense-in-depth (Hono bypasses via secret key)

### 3.4 Internationalization & Theming
- NFR-19: UI in Brazilian Portuguese (pt-BR) and English (en-US)
- NFR-20: Default language detected from `navigator.language` on first visit; user can switch, preference persisted in Pinia + localStorage
- NFR-21: Locations default to Brasil, Ceará, Fortaleza
- NFR-22: Dark/light mode detected from `prefers-color-scheme` system preference; user can toggle, preference persisted

### 3.5 Code Quality
- NFR-23: SOLID and DRY principles
- NFR-24: Stateful logic extracted to composables (`useMatch`, `useAuth`, `useGeolocation`, etc.)
- NFR-25: Components organized with atomic design (atoms / molecules / organisms)
- NFR-26: ESLint + Prettier for linting and formatting
- NFR-27: Husky + lint-staged pre-commit hook runs ESLint and Prettier on staged files
- NFR-28: Tests use **Vitest** for all API endpoints, composables, and utility functions

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

### 3.7 Browsers & Devices
- NFR-34: Responsive design — desktop and mobile via Quasar
- NFR-35: PWA support (installable, offline-capable)
