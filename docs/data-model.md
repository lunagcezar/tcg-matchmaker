# Data Model (Pre-SDD Review)

> **Architecture note — RLS**: All DB access goes through Hono Workers using the Supabase **secret key** (`sb_secret_...`) which bypasses RLS (replaces legacy `service_role` key). The frontend uses the **publishable key** (`sb_publishable_...`) exclusively for Supabase Auth (sign in/up) and never talks directly to the DB. RLS is still enabled on all tables as **defense-in-depth** — it protects the data in case the publishable key is ever misused or a client-side misconfiguration exposes the DB endpoint. Since the secret key bypasses RLS, Hono's application-level authorization is the primary security layer, with RLS as the fallback.

> **Architecture note — Images**: Avatar and logo columns store file paths (`text`) referencing Supabase Storage (S3-compatible). Storage handles binary data, not the DB. Validation: JPG only, max 2MB per file enforced at upload. This keeps the DB lean vs storing raw `bytea` blobs.

## Users

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, matches Supabase Auth user |
| email | string | from Supabase Auth |
| username | string | unique, permanent (kept on deletion for referential integrity) |
| display_name | string | changeable, anonymized to "Deleted User #N" on account deletion (LGPD) |
| role | enum | `player` | `organizer` | `admin` |
| avatar_path | string? | path in Supabase Storage (JPG only, max 2MB) |
| banned_at | timestamp? | if set, user is banned; API middleware rejects requests |
| ban_reason | text? | admin-provided reason |
| locked_until | timestamp? | after 5 failed login attempts, blocks login for 15 min |
| suspended_at | timestamp? | user-initiated suspension (LGPD); blocks event creation/joining |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp? | soft delete — all data preserved |

**Roles:**
- `player` — can create/join matches, RSVP to trading, register for tournaments.
- `organizer` — all player permissions + can create/manage tournaments.
- `admin` — all permissions (polymorphic) + platform moderation + can promote other users to admin.

**Last admin deletion protection:** account deletion is blocked if the user has `role = admin` and is the only admin remaining.

## TCGs (admin managed)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | string | e.g. "Magic: The Gathering" |
| slug | string | unique, URL-friendly |
| description | text? | |
| logo_path | string? | path in Supabase Storage |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp? | soft delete — existing events retain snapshot |

## Formats (admin managed, per TCG)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tcg_id | UUID | FK → tcgs |
| name | string | e.g. "Standard", "Modern", "Commander" |
| slug | string | unique per TCG |
| description | text? | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp? | soft delete — existing events retain snapshot |

## Game Stores

Stores can be created freely by authenticated users. Impersonation and abuse are handled after the fact via user reports and admin moderation tools.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | string | |
| slug | string | unique |
| description | text? | |
| country | string | default "Brasil" |
| state | string | default "Ceará" |
| city | string | default "Fortaleza" |
| address | string | street-level address |
| lat | float | required |
| lng | float | required |
| phone | string? | |
| website | string? | |
| logo_path | string? | path in Supabase Storage |
| created_by_user_id | UUID | FK → users (the user who originally created the store) |
| is_verified | boolean | default false — admin badge for legitimate stores |
| status | enum | `active` | `suspended` (default: active) |
| suspended_at | timestamp? | set when admin suspends the store |
| suspension_reason | text? | admin-provided reason for suspension |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp? | soft delete |

## Store Memberships

A store can have multiple associated users. Ownership is transferable.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| store_id | UUID | FK → game_stores |
| user_id | UUID | FK → users |
| role | enum | `owner` | `manager` | `staff` |
| created_at | timestamp | |

**Permissions by role:**
- **Owner**: edit store details, add/remove managers, add/remove staff, transfer ownership, delete store.
- **Manager**: edit store details, add/remove staff, create/edit events on behalf of the store.
- **Staff**: create events on behalf of the store, record bracket match results / walkovers.

**Constraints:**
- Unique `(store_id, user_id)` — one membership per user per store.
- Exactly one owner per store (partial unique index on `store_id` where `role = 'owner'`).

## Events (unified — matches, tournaments, trading sessions)

One table for all event types. Type-specific fields are nullable.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| type | enum | `match` | `tournament` | `trading` |
| created_by_user_id | UUID | FK → users — the person who clicked "Create" |
| organizer_user_id | UUID? | FK → users — event organized by this user personally |
| organizer_store_id | UUID? | FK → game_stores — event organized by this store |
| country | string | default "Brasil" |
| state | string | default "Ceará" |
| city | string | default "Fortaleza" |
| custom_location_name | string? | e.g. "Shopping Iguatemi" (when no store_id) |
| lat | float | required (from store or user-entered / geolocation) |
| lng | float | required |
| name | string? | auto-generated for matches, user-defined for tournaments/trading |
| description | text? | |
| details | text? | free text observations — match notes, trading wants/offers, etc. |
| scheduled_at | timestamp | proposed date/time |
| end_at | timestamp? | for multi-day tournaments |
| status | enum | `open` | `challenged` | `confirmed` | `in_progress` | `active` | `completed` | `cancelled` | `draft` | `planned` (see lifecycle below) |
| tcg_id | UUID? | FK → tcgs (nullable — general trading may not have a specific TCG) |
| tcg_name | string? | snapshot at creation — survives TCG deletion |
| format_id | UUID? | FK → formats (nullable — not used for trading) |
| format_name | string? | snapshot at creation — survives format deletion |
| max_participants | int? | null = unlimited (matches default to 2) |
| bracket_type | enum? | `single_elimination` | `double_elimination` | `round_robin` | `swiss` | `pool_play` (tournaments only) |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp? | soft delete |

**Organizer constraint:** exactly one of `organizer_user_id` / `organizer_store_id` must be non-null. When a store member creates an event, `created_by_user_id` is that member and `organizer_store_id` is the store.

**Status flows by type:**

**Match:**
```
open ──(enough confirmed participants)──▶ confirmed
open ──(challenge sent)──▶ challenged ──(accept)──▶ confirmed
confirmed ──(played)──▶ completed
any ──(cancel)──▶ cancelled
```

**Tournament:**
```
draft ──(publish)──▶ open ──(start)──▶ in_progress ──(final match done)──▶ completed
any ──(cancel)──▶ cancelled
```

**Trading session:**
```
planned ──(publish)──▶ active ──(date passed)──▶ completed
any ──(cancel)──▶ cancelled
```

## Event Participants

Unified table — replaces match confirmations and tournament participants.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| event_id | UUID | FK → events |
| user_id | UUID | FK → users |
| role | enum | `opponent` | `participant` |
| status | enum | `pending` | `confirmed` | `declined` | `checked_in` |
| confirmed_at | timestamp? | when user confirmed attendance |
| score | text? | match result/score, e.g. "2-1" |
| placement | int? | final tournament or pod placement |
| seed | int? | tournament seeding |
| created_at | timestamp | |

**Participant roles by event type:**
- **Match**: `opponent` = specific challenged player; `participant` = anyone who joins an open match.
- **Tournament**: `participant` = registered players.
- **Trading**: `participant` = RSVP'd attendees.

**Participant status by event type:**
- **Match / Trading**: `pending` (interested) → `confirmed` (committed to attend) or `declined`.
- **Tournament**: `pending` (registered) → `confirmed` (committed) → `checked_in` (at venue) or `declined`.

**Confirmation flow:**
- Joining or RSVPing sets status to `pending` ("interested").
- Hours before the event, the participant confirms attendance, setting status to `confirmed` and `confirmed_at`.
- For matches, the event status moves to `confirmed` when enough participants are `confirmed`.

## Bracket Rounds (tournaments only)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| event_id | UUID | FK → events (where type=tournament) |
| round_number | int | 1, 2, 3... |
| name | string | e.g. "Quartas de Final", "Semifinal" |
| created_at | timestamp | |

## Bracket Matches

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| round_id | UUID | FK → bracket_rounds |
| player1_id | UUID? | FK → users (null = bye or TBD) |
| player2_id | UUID? | FK → users (null = bye or TBD) |
| winner_id | UUID? | FK → users |
| score_player1 | int? | |
| score_player2 | int? | |
| status | enum | `pending` | `in_progress` | `completed` | `walkover` |
| next_match_id | UUID? | FK → bracket_matches — where the winner advances |
| next_match_player_slot | int? | 1 or 2 — which slot the winner occupies in the next match |
| scheduled_at | timestamp? | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Walkover (W.O.):** when a competitor does not attend, the organizer marks the match as `walkover` and sets `winner_id` to the present player (or surviving player). The winner advances normally via `next_match_id` / `next_match_player_slot`.

## Consents

LGPD consent recording at signup.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| policy_version | string | e.g. "1.0" |
| accepted_at | timestamp | |
| created_at | timestamp | |

## Notifications

In-app notifications delivered via Supabase Realtime. The frontend subscribes to a user's notifications and shows an unread badge. Browser push notifications (Web Push API) can be triggered by the same inserts for users who opt in.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| type | string | e.g. "match_invite", "rsvp", "bracket_advance", "store_suspended" |
| title | string | |
| body | text | |
| data | jsonb? | payload for deep linking |
| read_at | timestamp? | |
| created_at | timestamp | |

## Push Subscriptions

Browser push notification subscriptions (Web Push API). One row per user-device pair.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| endpoint | string | push service endpoint |
| p256dh | string | public key |
| auth | string | auth secret |
| user_agent | string? | for debugging |
| created_at | timestamp | |
| updated_at | timestamp | |

## Reports

Generic user reporting for moderation. Reports are reviewed by admins.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| reporter_id | UUID | FK → users |
| target_type | enum | `store` | `user` | `event` |
| target_id | UUID | |
| reason | text | user-provided reason |
| status | enum | `pending` | `resolved` | `dismissed` (default: pending) |
| admin_notes | text? | |
| created_at | timestamp | |
| resolved_at | timestamp? | |

## Audit Log

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| action | string | e.g. "user_banned", "user_unbanned", "avatar_removed", "tcg_deleted", "store_suspended", "ownership_transferred" |
| actor_id | UUID | FK → users (who performed the action) |
| target_type | string | e.g. "event", "user", "store" |
| target_id | UUID | |
| details | jsonb | arbitrary payload |
| created_at | timestamp | |
