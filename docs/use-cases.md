# Use Cases

## Actors

| Actor | Description |
|-------|-------------|
| **Visitor** | Unauthenticated user browsing the platform |
| **Player** | Authenticated user who plays TCGs |
| **Organizer** | Player who creates and manages tournaments |
| **Store Manager** | User linked to a game store, acts as organizer on behalf of the store |
| **Admin** | Platform moderator |

---

## UC-01: Sign Up

| Field | Value |
|-------|-------|
| Actor | Visitor |
| Precondition | None |
| Description | Visitor creates an account to become a Player |
| Flow | 1. Visitor clicks "Sign Up"<br>2. Enters email, password, username, display_name<br>3. System creates account via Supabase Auth<br>4. System creates user record in public.users<br>5. Visitor is logged in and redirected to home |
| Postcondition | Visitor is now a Player |

## UC-02: Edit Profile

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated |
| Description | Player changes display_name or avatar |
| Flow | 1. Player navigates to profile settings<br>2. Edits display_name and/or uploads new avatar (JPG, max 2MB)<br>3. System validates and saves changes |
| Postcondition | Profile updated |

## UC-03: Delete Account

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated |
| Description | Player exercises LGPD right to deletion — account and email are permanently removed |
| Flow | 1. Player requests account deletion<br>2. System confirms intent with warning (irreversible)<br>3. System permanently deletes Supabase Auth user (email erased)<br>4. System sets `deleted_at` on `public.users` record<br>5. System anonymizes `display_name` to "Deleted User #N" and clears `avatar_path`<br>6. All match/tournament data is preserved with FK integrity<br>7. Player is logged out and redirected to home |
| Postcondition | Auth user deleted. Player cannot log in again. Same email can be used to register a new account. Match history preserved under "Deleted User #N". |

## UC-04: Browse Events Near Me

| Field | Value |
|-------|-------|
| Actor | Visitor / Player |
| Precondition | None |
| Description | User browses events (matches, trading sessions, tournaments) near a location |
| Flow | 1. User opens the map or list view<br>2. Default location: browser Geolocation API asks for permission → if granted, center on user's current location; otherwise, fall back to Fortaleza, Ceará, Brasil<br>3. User can filter by event type (matches, trading, tournaments), TCG, format, date, status<br>4. System displays events as color-coded markers on map + list below<br>5. User clicks an event to see details |
| Postcondition | None |

## UC-05: Create a Match (Open or Invite)

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, not banned |
| Description | Player creates a match — open for anyone to join or inviting specific players |
| Flow | 1. Player clicks "Create Match"<br>2. Selects TCG and Format<br>3. Sets date/time<br>4. Chooses location: selects existing game store OR uses autocomplete for custom location<br>5. Confirms lat/lng on the map<br>6. Sets max participants (default 2, can be higher for Commander)<br>7. Chooses mode: "Open for anyone" OR "Invite specific people"<br>8. If inviting: searches and selects players by username<br>9. Adds optional notes<br>10. System creates event with status `open` (or `challenged` if specific invites)<br>11. Invited players receive notification |
| Postcondition | Event appears on the map. Invited players see pending invitation. |

## UC-06: Create a Match (Challenge Specific Player)

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, not banned |
| Description | Player challenges a specific player to a match |
| Flow | 1. Player follows UC-05 steps 1-7<br>2. Instead of "Looking for opponent", selects a specific player<br>3. Searches by username<br>4. System creates match with status `challenged`<br>5. Challenged player receives notification |
| Postcondition | Match appears in both players' pending lists. Challenger waits for response. |

## UC-07: Join a Match

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, not banned, match has status `looking_for_opponent` |
| Description | Player joins an open match |
| Flow | 1. Player views match details<br>2. Clicks "Join Match"<br>3. System sets `opponent_id` to current player<br>4. System changes match status to `confirmed`<br>5. Both players receive confirmation |
| Postcondition | Match is confirmed. Both players have match details. |

## UC-08: Accept/Decline Challenge

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, match has status `challenged`, current user is `opponent_id` |
| Description | Player responds to a challenge |
| Flow | 1. Player views match details or notification<br>2. Clicks "Accept" or "Decline"<br>3. If Accept: system changes status to `confirmed`<br>4. If Decline: system changes status to `cancelled` |
| Postcondition | Match confirmed or cancelled. Creator notified. |

## UC-09: Cancel Match

| Field | Value |
|-------|-------|
| Actor | Player (creator or opponent) |
| Precondition | Authenticated, match not completed |
| Description | Player cancels a match |
| Flow | 1. Player views match details<br>2. Clicks "Cancel Match"<br>3. System changes status to `cancelled`<br>4. Other player notified |
| Postcondition | Match cancelled. Stored in history. |

## UC-10: Complete Match

| Field | Value |
|-------|-------|
| Actor | Player (both) |
| Precondition | Match status is `confirmed` |
| Description | Both players confirm the match was played |
| Flow | 1. Each player clicks "Match Played"<br>2. Each confirms the result<br>3. When both have confirmed, system sets status to `completed` |
| Postcondition | Match marked completed. Added to both players' history. |

## UC-11: Create Trading Session

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, not banned |
| Description | Player organizes a card trading meetup |
| Flow | 1. Player clicks "Create Trading Session"<br>2. Optionally selects a TCG (or leaves as "Any TCG" for general trading)<br>3. Sets date/time<br>4. Chooses location (store or custom location with autocomplete)<br>5. Confirms lat/lng on map<br>6. Adds description: what they're looking for, what they're offering<br>7. Sets optional max participants<br>8. System creates event with status `planned`<br>9. Other players can RSVP |
| Postcondition | Trading session appears on map. Players can RSVP. |

## UC-12: RSVP to a Trading Session

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, not banned, session is `planned` or `active` |
| Description | Player RSVPs to a trading session |
| Flow | 1. Player views trading session details<br>2. Clicks "RSVP"<br>3. System adds player to event_participants with status `pending`<br>4. Creator is notified of new attendee |
| Postcondition | Player listed as attendee. Shows on their upcoming events. |

## UC-13: Submit Game Store Registration

| Field | Value |
|-------|-------|
| Actor | Player / Organizer |
| Precondition | Authenticated, not banned |
| Description | User submits a game store for approval |
| Flow | 1. User navigates to "Add Store"<br>2. Fills in name, address (with autocomplete), phone, website, logo<br>3. Confirms lat/lng on map<br>4. Submits form<br>5. Store is created with status `pending`<br>6. Admin is notified of new pending store |
| Postcondition | Store is hidden from public view until admin approves. User is notified on approval/rejection. |

## UC-14: Approve/Reject Store (Admin)

| Field | Value |
|-------|-------|
| Actor | Admin |
| Precondition | Authenticated as admin |
| Description | Admin reviews a pending store registration |
| Flow | 1. Admin opens pending stores list<br>2. Reviews store details (name, address, location on map)<br>3. Clicks "Approve" or "Reject"<br>4. If approve: store status changes to `approved`, becomes visible on map, submitter becomes `managed_by_user_id`<br>5. If reject: store status changes to `rejected`, submitter is notified with reason |
| Postcondition | Approved stores appear on map. Submitter can edit their approved store's details. |

## UC-15: Create Tournament

| Field | Value |
|-------|-------|
| Actor | Organizer (user or store manager) |
| Precondition | Authenticated, not banned |
| Description | Organizer creates a tournament |
| Flow | 1. Organizer clicks "Create Tournament"<br>2. Selects TCG and Format<br>3. Selects bracket type, max participants, date range<br>4. Chooses location (store or custom)<br>5. Sets tournament name and description<br>6. System creates tournament with status `draft`<br>7. Organizer can publish it to open registration |
| Postcondition | Tournament created. If published, appears in tournament listings. |

## UC-16: Register for Tournament

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, not banned, tournament status is `open`, spots available |
| Description | Player registers for a tournament |
| Flow | 1. Player views tournament details<br>2. Clicks "Register"<br>3. System adds player to event_participants with status `pending`<br>4. If max_participants reached, tournament shows as full |
| Postcondition | Player is registered. Check-in required before start. |

## UC-17: Check-in Participants

| Field | Value |
|-------|-------|
| Actor | Organizer |
| Precondition | Tournament is `open` or `in_progress` |
| Description | Organizer checks in registered players before starting |
| Flow | 1. Organizer views participant list<br>2. Marks each present player as checked_in<br>3. Can remove no-shows from the tournament<br>4. When ready, starts the tournament |
| Postcondition | Tournament status changes to `in_progress`. Bracket is generated. |

## UC-18: Generate and Advance Bracket

| Field | Value |
|-------|-------|
| Actor | Organizer |
| Precondition | Tournament status is `in_progress`, participants checked in |
| Description | System generates bracket rounds and organizer advances winners |
| Flow | 1. System generates bracket_rounds and bracket_matches based on bracket_type<br>2. Players see their matchups<br>3. After match completion, organizer records the winner<br>4. System advances winner to next round<br>5. Repeat until final round determines champion |
| Postcondition | Bracket progresses. Tournament status changes to `completed` after final. |

## UC-19: Report Bracket Match Result

| Field | Value |
|-------|-------|
| Actor | Player (in a bracket match) |
| Precondition | Bracket match status is `pending` |
| Description | Player reports the result of their bracket match |
| Flow | 1. Player views their bracket match<br>2. Reports score (e.g., 2-1)<br>3. Opponent confirms or disputes<br>4. If both agree (or organizer overrides), match is completed<br>5. Winner is recorded, organizer advances them |
| Postcondition | Bracket match completed. Winner moves to next round. |

## UC-20: Admin Moderation — Ban User

| Field | Value |
|-------|-------|
| Actor | Admin |
| Precondition | Authenticated as admin |
| Description | Admin bans a user for improper behavior |
| Flow | 1. Admin views user profile<br>2. Clicks "Ban User"<br>3. Provides reason<br>4. System sets `banned_at` and `ban_reason`<br>5. Action logged in Audit Log |
| Postcondition | User cannot log in, create events, or join events. Their existing events are preserved. |

## UC-21: Admin Moderation — Remove Avatar

| Field | Value |
|-------|-------|
| Actor | Admin |
| Precondition | Authenticated as admin |
| Description | Admin removes an improper avatar |
| Flow | 1. Admin views user profile<br>2. Clicks "Remove Avatar"<br>3. System sets `avatar_path` to null<br>4. Action logged in Audit Log |
| Postcondition | User's avatar reverts to default. User can upload a new one. |

## UC-22: Location Autocomplete & Geolocation

| Field | Value |
|-------|-------|
| Actor | Any user creating an event or browsing |
| Precondition | None |
| Description | User searches for a location by name or uses their current position |
| Flow | 1. (Autocomplete) User starts typing in the location field<br>2. Frontend calls Hono `/api/geocode/search?q=...` after debounce<br>3. Hono proxies to Nominatim, returns suggestions<br>4. User selects one suggestion<br>5. City, state, lat, lng auto-filled<br>6. Map displays a marker<br>7. (Geolocation) User clicks "Near me" — browser requests location permission<br>8. Map centers on user's current coordinates |
| Postcondition | Location data populated. Marker on map. |

## UC-23: Switch Language

| Field | Value |
|-------|-------|
| Actor | Any user |
| Precondition | None |
| Description | User switches interface language |
| Flow | 1. User clicks language selector<br>2. Selects "Português (Brasil)" or "English"<br>3. System switches all UI text to selected language<br>4. Preference stored in local storage / user profile |
| Postcondition | Interface language changed. |

## UC-24: Export Personal Data (LGPD)

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated |
| Description | User downloads all their personal data in JSON format (right to portability) |
| Flow | 1. User navigates to settings<br>2. Clicks "Export My Data"<br>3. System collects: profile info, event history, participation records, consent record<br>4. System returns JSON file download<br>5. Data includes timestamps and relationships for full context |
| Postcondition | User has a copy of all personal data. No data is altered. |

## UC-25: Suspend Account

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated |
| Description | User temporarily suspends their account without data deletion |
| Flow | 1. User requests account suspension<br>2. Confirms intent<br>3. System sets `suspended_at` timestamp<br>4. User is logged out<br>5. Suspended users cannot create/join events (checked in Hono middleware) |
| Postcondition | Account suspended. All data preserved. User can contact support or log in to reactivate. |

## UC-26: Use Browser Geolocation

| Field | Value |
|-------|-------|
| Actor | Any user |
| Precondition | Browser supports Geolocation API |
| Description | User allows location access to find events near their current position |
| Flow | 1. User clicks "Find near me" on the home/map page<br>2. Browser asks for location permission<br>3. If granted: map centers on user's coordinates, events sorted by distance<br>4. If denied: nothing changes, fallback to default location |
| Postcondition | Map shows events nearest to user's current location.
