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
| Flow | 1. Player requests account deletion<br>2. System confirms intent with warning (irreversible)<br>3. If user is an admin, system checks that at least one other admin exists; if not, deletion is blocked<br>4. System permanently deletes Supabase Auth user (email erased)<br>5. System sets `deleted_at` on `public.users` record<br>6. System anonymizes `display_name` to "Deleted User #N" and clears `avatar_path`<br>7. All match/tournament data is preserved with FK integrity<br>8. Player is logged out and redirected to home |
| Postcondition | Auth user deleted. Player cannot log in again. Same email can be used to register a new account. Match history preserved under "Deleted User #N". Last remaining admin cannot delete their account. |

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
| Flow | 1. Player clicks "Create Match"<br>2. Selects organizer: himself or one of his stores (owner/manager/staff)<br>3. Selects TCG and Format<br>4. Sets date/time<br>5. Chooses location: selects existing game store OR uses autocomplete for custom location<br>6. Confirms lat/lng on the map<br>7. Sets max participants (default 2, can be higher for Commander)<br>8. Chooses mode: "Open for anyone" OR "Invite specific people"<br>9. If inviting: searches and selects players by username<br>10. Adds optional notes<br>11. System creates event with status `open` (or `challenged` if specific invites)<br>12. Invited players receive notification |
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
| Precondition | Authenticated, not banned, match has status `open` |
| Description | Player expresses interest in an open match |
| Flow | 1. Player views match details<br>2. Clicks "Join Match"<br>3. System adds player to event_participants with role `participant`, status `pending`<br>4. Player receives a reminder to confirm attendance before the match |
| Postcondition | Player is listed as pending. Match remains `open` until enough participants confirm. |

## UC-08: Confirm Match Attendance

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, participant status is `pending`, match is `open` or `confirmed` |
| Description | Player confirms they will attend the match |
| Flow | 1. Player views match details or receives reminder<br>2. Clicks "Confirm Attendance"<br>3. System updates participant status to `confirmed` and sets `confirmed_at`<br>4. If enough participants are now `confirmed`, system changes match status to `confirmed`<br>5. All confirmed participants receive confirmation |
| Postcondition | Player is committed to attend. Match may move to `confirmed`. |

## UC-09: Accept/Decline Challenge

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, match has status `challenged`, current user is an invited participant in event_participants |
| Description | Player responds to a direct challenge |
| Flow | 1. Player views match details or notification<br>2. Clicks "Accept" or "Decline"<br>3. If Accept: system updates participant status to `confirmed`, changes match status to `confirmed`<br>4. If Decline: system updates participant status to `declined`, changes match status back to `open` so the creator can invite someone else |
| Postcondition | Match confirmed or returned to `open`. Creator notified. Accepted players must still confirm attendance before the match. |

## UC-10: Cancel Match

| Field | Value |
|-------|-------|
| Actor | Player (creator or opponent) |
| Precondition | Authenticated, match not completed |
| Description | Player cancels a match |
| Flow | 1. Player views match details<br>2. Clicks "Cancel Match"<br>3. System changes status to `cancelled`<br>4. Other player notified |
| Postcondition | Match cancelled. Stored in history. |

## UC-11: Complete Match

| Field | Value |
|-------|-------|
| Actor | Player (all confirmed participants) |
| Precondition | Match status is `confirmed` |
| Description | All players report the match result |
| Flow | 1. Each participant opens the match<br>2. Enters their score/placement<br>3. Submits result<br>4. When all participants have submitted matching results, system sets match status to `completed` and stores scores in `event_participants`<br>5. If results conflict, creator or participants can request correction |
| Postcondition | Match marked completed. Scores stored. Added to participants' history. |

## UC-12: Create Trading Session

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, not banned |
| Description | Player organizes a card trading meetup |
| Flow | 1. Player clicks "Create Trading Session"<br>2. Selects organizer: himself or one of his stores<br>3. Optionally selects a TCG (or leaves as "Any TCG" for general trading)<br>4. Sets date/time<br>5. Chooses location (store or custom location with autocomplete)<br>6. Confirms lat/lng on map<br>7. Adds description: what they're looking for, what they're offering<br>8. Sets optional max participants<br>9. Optionally invites registered users (UC-35)<br>10. System creates event with status `planned`<br>11. Other players can RSVP |
| Postcondition | Trading session appears on map. Players can RSVP. |

## UC-13: RSVP to a Trading Session

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, not banned, session is `planned` or `active` |
| Description | Player RSVPs to a trading session |
| Flow | 1. Player views trading session details<br>2. Clicks "RSVP"<br>3. System adds player to event_participants with status `pending`<br>4. Player confirms attendance before the session, moving status to `confirmed`<br>5. Creator is notified of confirmed attendees |
| Postcondition | Player listed as confirmed attendee. Shows on their upcoming events. |

## UC-14: Create Game Store

| Field | Value |
|-------|-------|
| Actor | Player / Organizer |
| Precondition | Authenticated, not banned |
| Description | User creates a game store and becomes its owner |
| Flow | 1. User navigates to "Add Store"<br>2. Fills in name, address (with autocomplete), phone, website, logo<br>3. Confirms lat/lng on map<br>4. Submits form<br>5. Store is created with status `active`<br>6. User becomes owner in `store_memberships` |
| Postcondition | Store appears on the map. Creator is owner and can add managers/staff. |

## UC-15: Verify or Suspend Store (Admin)

| Field | Value |
|-------|-------|
| Actor | Admin |
| Precondition | Authenticated as admin |
| Description | Admin verifies a legitimate store or suspends an impersonating/abusive one |
| Flow | 1. Admin opens store list or report queue<br>2. Reviews store details and any reports<br>3. Clicks "Verify" to set `is_verified = true`<br>4. Or clicks "Suspend" and provides a reason — store status becomes `suspended`<br>5. Action is logged in Audit Log |
| Postcondition | Verified store shows a badge. Suspended store is hidden from map and cannot host new events. |

## UC-16: Create Tournament

| Field | Value |
|-------|-------|
| Actor | Organizer (user or store manager) |
| Precondition | Authenticated, not banned |
| Description | Organizer creates a tournament |
| Flow | 1. Organizer clicks "Create Tournament"<br>2. Selects organizer: himself or one of his stores<br>3. Selects TCG and Format<br>4. Selects bracket type — flexible choice at creation:<br>   - Single elimination (fastest, dramatic)<br>   - Double elimination (second chance)<br>   - Round robin (everyone plays everyone, small groups)<br>   - Swiss system (balanced matchups, large fields, MTG standard)<br>   - Pool play + playoffs (group stage into knockout, World Cup style)<br>5. Sets max participants and date range<br>6. Chooses location (store or custom)<br>7. Sets tournament name and description<br>8. Optionally invites registered users (UC-35)<br>9. System creates tournament with status `draft`<br>10. Organizer can publish it to open registration |
| Postcondition | Tournament created with selected bracket type. If published, appears in tournament listings. |

## UC-17: Register for Tournament

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, not banned, tournament status is `open`, spots available |
| Description | Player registers for a tournament |
| Flow | 1. Player views tournament details<br>2. Clicks "Register"<br>3. System adds player to event_participants with status `pending`<br>4. Player confirms registration before the tournament, moving status to `confirmed`<br>5. If max_participants reached, tournament shows as full |
| Postcondition | Player is confirmed. Check-in required before start. |

## UC-18: Check-in Participants

| Field | Value |
|-------|-------|
| Actor | Organizer |
| Precondition | Tournament is `open` or `in_progress` |
| Description | Organizer checks in registered players before starting |
| Flow | 1. Organizer views participant list<br>2. Marks each present player as checked_in<br>3. Can remove no-shows from the tournament<br>4. When ready, starts the tournament |
| Postcondition | Tournament status changes to `in_progress`. Bracket is generated. |

## UC-19: Generate and Advance Bracket

| Field | Value |
|-------|-------|
| Actor | Organizer |
| Precondition | Tournament status is `in_progress`, participants checked in |
| Description | System generates bracket rounds and organizer advances winners |
| Flow | 1. System generates bracket_rounds and bracket_matches based on bracket_type, setting `next_match_id` and `next_match_player_slot`<br>2. Players see their matchups<br>3. After match completion or walkover, organizer records the winner<br>4. System advances winner to the next match via `next_match_id` / `next_match_player_slot`<br>5. Repeat until final round determines champion |
| Postcondition | Bracket progresses. Tournament status changes to `completed` after final. |

## UC-20: Report Bracket Match Result

| Field | Value |
|-------|-------|
| Actor | Player (in a bracket match) |
| Precondition | Bracket match status is `pending` |
| Description | Player reports the result of their bracket match |
| Flow | 1. Player views their bracket match<br>2. Reports score (e.g., 2-1)<br>3. Opponent confirms or disputes<br>4. If both agree (or organizer overrides), match is completed<br>5. Winner is recorded, organizer advances them |
| Postcondition | Bracket match completed. Winner moves to next round. |

## UC-21: Admin Moderation — Ban User

| Field | Value |
|-------|-------|
| Actor | Admin |
| Precondition | Authenticated as admin |
| Description | Admin bans a user for improper behavior |
| Flow | 1. Admin views user profile<br>2. Clicks "Ban User"<br>3. Provides reason<br>4. System sets `banned_at` and `ban_reason`<br>5. Action logged in Audit Log |
| Postcondition | User cannot log in, create events, or join events. Their existing events are preserved. |

## UC-22: Admin Moderation — Remove Avatar

| Field | Value |
|-------|-------|
| Actor | Admin |
| Precondition | Authenticated as admin |
| Description | Admin removes an improper avatar |
| Flow | 1. Admin views user profile<br>2. Clicks "Remove Avatar"<br>3. System sets `avatar_path` to null<br>4. Action logged in Audit Log |
| Postcondition | User's avatar reverts to default. User can upload a new one. |

## UC-23: Location Autocomplete & Geolocation

| Field | Value |
|-------|-------|
| Actor | Any user creating an event or browsing |
| Precondition | None |
| Description | User searches for a location by name or uses their current position |
| Flow | 1. (Autocomplete) User starts typing in the location field<br>2. Frontend calls Hono `/api/geocode/search?q=...` after debounce<br>3. Hono proxies to Nominatim, returns suggestions<br>4. User selects one suggestion<br>5. City, state, lat, lng auto-filled<br>6. Map displays a marker<br>7. (Geolocation) User clicks "Near me" — browser requests location permission<br>8. Map centers on user's current coordinates |
| Postcondition | Location data populated. Marker on map. |

## UC-24: Switch Language

| Field | Value |
|-------|-------|
| Actor | Any user |
| Precondition | None |
| Description | User switches interface language |
| Flow | 1. User clicks language selector<br>2. Selects "Português (Brasil)" or "English"<br>3. System switches all UI text to selected language<br>4. Preference stored in local storage / user profile |
| Postcondition | Interface language changed. |

## UC-25: Export Personal Data (LGPD)

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated |
| Description | User downloads all their personal data in JSON format (right to portability) |
| Flow | 1. User navigates to settings<br>2. Clicks "Export My Data"<br>3. System collects: profile info, event history, participation records, consent record<br>4. System returns JSON file download<br>5. Data includes timestamps and relationships for full context |
| Postcondition | User has a copy of all personal data. No data is altered. |

## UC-26: Suspend Account

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated |
| Description | User temporarily suspends their account without data deletion |
| Flow | 1. User requests account suspension<br>2. Confirms intent<br>3. System sets `suspended_at` timestamp<br>4. User is logged out<br>5. Suspended users cannot create/join events (checked in Hono middleware) |
| Postcondition | Account suspended. All data preserved. Logging in clears `suspended_at` and reactivates the account. |

## UC-27: Use Browser Geolocation

| Field | Value |
|-------|-------|
| Actor | Any user |
| Precondition | Browser supports Geolocation API |
| Description | User allows location access to find events near their current position |
| Flow | 1. User clicks "Find near me" on the home/map page<br>2. Browser asks for location permission<br>3. If granted: map centers on user's coordinates, events sorted by distance<br>4. If denied: nothing changes, fallback to default location |
| Postcondition | Map shows events nearest to user's current location.

## UC-28: Add Store Member

| Field | Value |
|-------|-------|
| Actor | Store Owner / Manager |
| Precondition | Authenticated, is owner or manager of the store |
| Description | Owner or manager adds another user to the store team |
| Flow | 1. Owner/manager opens store settings<br>2. Searches user by username or email<br>3. Selects role (`manager` or `staff`)<br>4. System creates `store_memberships` record<br>5. New member is notified |
| Postcondition | New member can act on behalf of the store according to their role.

## UC-29: Transfer Store Ownership

| Field | Value |
|-------|-------|
| Actor | Store Owner |
| Precondition | Authenticated, is owner of the store |
| Description | Owner transfers full ownership to another member |
| Flow | 1. Owner opens store settings<br>2. Selects an existing manager or staff member<br>3. Clicks "Transfer Ownership"<br>4. System confirms intent (irreversible warning)<br>5. System updates memberships: old owner becomes manager, selected member becomes owner<br>6. Action logged in Audit Log |
| Postcondition | Selected member becomes owner. Old owner retains manager access unless removed.

## UC-30: Report Store, User, or Event

| Field | Value |
|-------|-------|
| Actor | Any authenticated user |
| Precondition | Authenticated |
| Description | User reports impersonation, abuse, or incorrect information |
| Flow | 1. User opens report dialog on a store, user profile, or event page<br>2. Selects report reason and provides details<br>3. System creates a `reports` record with status `pending`<br>4. Admin is notified |
| Postcondition | Report queued for admin review.

## UC-31: Mark Tournament Match as Walkover (W.O.)

| Field | Value |
|-------|-------|
| Actor | Organizer / Store Staff |
| Precondition | Tournament is `in_progress`, bracket match is `pending` or `in_progress` |
| Description | Organizer marks that one competitor did not attend and awards the match to the present player |
| Flow | 1. Organizer opens the bracket match<br>2. Clicks "Mark as Walkover"<br>3. Selects the winner (present player or surviving player)<br>4. System sets `status = walkover` and `winner_id`<br>5. System advances winner to next match via `next_match_id` / `next_match_player_slot`<br>6. Players are notified |
| Postcondition | Match completed by W.O. Winner advances normally.

## UC-32: Onboarding — First Admin Setup

| Field | Value |
|-------|-------|
| Actor | First visitor (no users exist yet) |
| Precondition | `public.users` table has no admin users |
| Description | First user creates the admin account during initial platform setup |
| Flow | 1. Visitor opens the app<br>2. Middleware detects no admin exists and redirects to `/onboarding`<br>3. Visitor fills onboarding form: email, password, username, display_name<br>4. System creates Supabase Auth user<br>5. System creates `public.users` record with `role = admin`<br>6. System records consent<br>7. Visitor is logged in and redirected to home |
| Postcondition | First admin created. Onboarding page is never shown again.

## UC-33: Promote User to Admin

| Field | Value |
|-------|-------|
| Actor | Admin |
| Precondition | Authenticated as admin, target user exists and is not already admin |
| Description | Admin grants admin role to another user |
| Flow | 1. Admin opens user management (`/admin/users`)<br>2. Finds target user<br>3. Clicks "Promote to Admin"<br>4. System confirms intent<br>5. System updates target user's `role` to `admin`<br>6. Action logged in Audit Log |
| Postcondition | Target user is now admin. Admin promotion is irreversible except by another admin.

## UC-34: Delete Admin Account — Last Admin Protection

| Field | Value |
|-------|-------|
| Actor | Admin |
| Precondition | Authenticated as admin |
| Description | Admin attempts to delete their account, but the system protects the last admin |
| Flow | 1. Admin follows UC-03 delete account flow<br>2. System counts users with `role = admin`<br>3. If count is 1, system rejects deletion with error: "Promote another admin before deleting your account"<br>4. If count is 2 or more, deletion proceeds normally |
| Postcondition | Last admin cannot be deleted. Multiple admins allow safe deletion.

## UC-35: Invite User to Event

| Field | Value |
|-------|-------|
| Actor | Event Creator (Player, Organizer, Store Member, or Admin) |
| Precondition | Authenticated, event exists, target user is registered |
| Description | Creator invites a specific registered user to a match, trading session, or tournament |
| Flow | 1. Creator opens event details or creation flow<br>2. Searches and selects registered user by username<br>3. Clicks "Invite"<br>4. System adds invited user to `event_participants` with status `pending`<br>5. System creates a notification for the invited user<br>6. Invited user receives in-app (and push, if enabled) notification |
| Postcondition | Invited user can accept or decline. For matches, event status becomes `challenged` if only specific invitees are allowed.

## UC-36: Enable Browser Push Notifications

| Field | Value |
|-------|-------|
| Actor | Player |
| Precondition | Authenticated, browser supports Push API |
| Description | User opts in to receive browser push notifications for event updates |
| Flow | 1. User opens settings or sees an opt-in prompt<br>2. Clicks "Enable Notifications"<br>3. Browser requests permission<br>4. If granted, service worker generates a push subscription<br>5. Frontend sends subscription (`endpoint`, `p256dh`, `auth`) to Hono<br>6. System stores subscription in `push_subscriptions`<br>7. When a notification is created for the user, Supabase Realtime or backend also sends a push message to subscribed endpoints |
| Postcondition | User receives browser push notifications for relevant events.
