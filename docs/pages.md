# Pages & Routes

## Route Map

```
/                            Home — split view: map (left) + event feed (right), filters on top
/login                       Sign in
/signup                      Register

/profile/:username           Profile page — event history, stats
/settings                    Edit profile — display_name, avatar, language

/matches/new                 Create a new match
/matches/:id                 Match details — join, confirm, cancel

/trading/new                 Create a new trading session
/trading/:id                 Trading session details — RSVP, view attendees

/tournaments/new             Create a new tournament
/tournaments/:id             Tournament details — bracket view, registration
/tournaments/:id/manage      Organizer panel — check-in, advance rounds

/stores                      Game store list + map view
/stores/new                  Submit a new game store (pending approval)
/stores/:id                  Store details — events at this store

/admin                       Admin dashboard
/admin/tcgs                  Manage TCGs
/admin/tcgs/:id/formats      Manage formats for a TCG
/admin/stores                Manage game stores
/admin/users                 Manage users — ban/unban
/admin/audit                 Audit log
```

## Layout Structure

| Layout | Routes |
|--------|--------|
| `MainLayout` | `/`, `/login`, `/signup`, `/profile/:username`, `/settings`, `/matches/*`, `/trading/*`, `/tournaments/*`, `/stores/*` |
| `AdminLayout` | `/admin/*` |

## Component Organization (Atomic Design)

```
src/
  pages/                     — Pages layer (HomePage, LoginPage, MatchDetailPage, ...)
  layouts/                   — Templates layer (MainLayout, AdminLayout)
  components/
    atoms/                   — Smallest building blocks, highly reusable
      AppButton, AppCard, AppSection, AppAvatar, AppBadge, AppIcon
    molecules/               — Composed atoms with a single purpose
      fields/
        TextField, SelectField, LocationAutocomplete
      cards/
        EventCard, UserCard, StoreCard
      navigation/
        MainNavigation, AdminNavigation
    organisms/               — Feature-specific sections
      home/
        EventMap, FilterPanel, EventList, GeolocateButton
      match/
        MatchCreateForm, ParticipantConfirmList
      trading/
        TradingCreateForm, AttendeeList, RsvpButton
      tournament/
        BracketView, ParticipantRegisterList
      admin/
        TcgForm, FormatList, UserBanDialog
  composables/               — useAuth, useMatch, useGeolocation, useTournament, useTrading
  stores/                    — Pinia: useAuthStore, useAppStore
  i18n/                      — en-US.ts, pt-BR.ts
  router/                    — Vue Router routes (index.ts)
```

## Home Page Layout (Split View)

The home page (`/`) answers three questions at a glance: where, what, and how to participate.

```
┌──────────────────────────────────────────┐
│  Header: logo + compact filter row       │
│  (TCG dropdown, event type pills)        │
│  [more filters] expandable               │
├──────────────────────┬───────────────────┤
│                      │  Event Feed       │
│      Map             │  ┌─────────────┐  │
│    (Leaflet,         │  │ MTG Cmd     │  │
│     markers          │  │ • 15 min ·  │  │
│     color-coded      │  │   Store X   │  │
│     by event type)   │  │ • 2/4 spots │  │
│                      │  └─────────────┘  │
│     [📍] locate      │  ┌─────────────┐  │
│                      │  │ Pokémon T   │  │
│                      │  │ • Today 3pm │  │
│                      │  │ • Shopping  │  │
│                      │  │ • 3/10 RSVP │  │
│                      │  └─────────────┘  │
│                      │  ┌─────────────┐  │
│                      │  │ Standard T  │  │
│                      │  │ • Sat 10am  │  │
│                      │  │ • Store Y   │  │
│                      │  │ • 8/16 reg  │  │
│                      │  └─────────────┘  │
└──────────────────────┴───────────────────┘
                     [+ FAB on mobile]
```

- **Desktop**: map left (~60%), feed right (~40%)
- **Mobile**: map top (collapsible with minimize button), feed below, filters in a drawer
- **Filter bar**: compact — only TCG selector + event type pills visible; "More filters" expands format, date range, status in a drawer/popover
- **Map markers**: color-coded by event type (match, trading, tournament), click for preview card
- **Geolocation**: subtle icon button on the map (📍), not a text button; defaults to Fortaleza until permission granted
- **Feed cards**: compact, single-line style — event type badge + TCG/format + relative time + location + spots filled. No hero treatment, no cards larger than one row
- **Create**: Quasar `QPageSticky` FAB on mobile (absolute position, bottom-right); small "Create" dropdown in header on desktop with options: Match, Trading Session, Tournament, Add Store

## Geolocate Button

- A "Find near me" button on the home page (/)
- Uses browser `navigator.geolocation.getCurrentPosition()`
- On success: centers map on user coordinates, sorts events by distance
- On error/denied: shows a toast, keeps current map center
- Requires HTTPS for Geolocation API to work (Cloudflare Pages provides this)

## Auth Guards

- **Public**: `/`, `/login`, `/signup`, `/stores`, `/stores/:id`
- **Authenticated**: `/profile/:username`, `/settings`, `/matches/*`, `/trading/*`, join/RSVP actions
- **Organizer**: `/tournaments/new`, `/tournaments/:id/manage`
- **Admin**: `/admin/*`

## Notes

- `/matches/new`, `/trading/new`, `/tournaments/new` redirect unauthenticated users to `/login`
- `/admin/*` redirects non-admin users to `/`
- `/tournaments/:id/manage` redirects non-organizer to `/tournaments/:id`
- All event types (matches, trading, tournaments) share the unified `events` table but have type-specific pages
