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
| managed_by_user_id | UUID? | FK → users (store manager, set on approval) |
| status | enum | `pending` | `approved` | `rejected` (default: pending) |
| submitted_by | UUID? | FK → users (who submitted the registration) |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp? | soft delete |

## Events (unified — matches, tournaments, trading sessions)

One table for all event types. Type-specific fields are nullable.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| type | enum | `match` | `tournament` | `trading` |
| creator_id | UUID | FK → users |
| creator_type | enum | `user` | `store` |
| store_id | UUID? | FK → game_stores (null for community locations) |
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
| status | enum | varies by type (see below) |
| tcg_id | UUID? | FK → tcgs (nullable — general trading may not have a specific TCG) |
| tcg_name | string? | snapshot at creation — survives TCG deletion |
| format_id | UUID? | FK → formats (nullable — not used for trading) |
| format_name | string? | snapshot at creation — survives format deletion |
| max_participants | int? | null = unlimited (matches default to 2) |
| bracket_type | enum? | `single_elimination` | `double_elimination` | `round_robin` | `swiss` | `pool_play` (tournaments only) |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp? | soft delete |

**Status flows by type:**

**Match:**
```
open ──(player joins)──▶ confirmed
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
| role | enum | `creator` | `opponent` | `participant` |
| status | enum | `pending` | `confirmed` | `declined` | `checked_in` |
| confirmed_at | timestamp? | when user confirmed |
| seed | int? | tournament seeding |
| placement | int? | tournament final placement |
| created_at | timestamp | |

**Participant roles by event type:**
- **Match**: creator = auto-confirmed creator. opponent = specific challenged player. participant = anyone who joins an open match.
- **Tournament**: creator = organizer. participant = registered players.
- **Trading**: creator = organizer. participant = RSVP'd attendees.

**Participant status by event type:**
- **Match**: creator → `confirmed`. opponent → `pending` → `confirmed` or `declined`.
- **Tournament**: participant → `pending` → `checked_in`.
- **Trading**: participant → `pending` → `confirmed`.

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
| player1_id | UUID? | FK → users (null = bye) |
| player2_id | UUID? | FK → users (null = bye or TBD) |
| winner_id | UUID? | FK → users |
| score_player1 | int? | |
| score_player2 | int? | |
| status | enum | `pending` | `in_progress` | `completed` |
| scheduled_at | timestamp? | |
| created_at | timestamp | |
| updated_at | timestamp | |

## Audit Log

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| action | string | e.g. "user_banned", "user_unbanned", "avatar_removed", "tcg_deleted" |
| actor_id | UUID | FK → users (who performed the action) |
| target_type | string | e.g. "event", "user" |
| target_id | UUID | |
| details | jsonb | arbitrary payload |
| created_at | timestamp | |
