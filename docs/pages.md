# Pages & Routes

## Route Map

```
/onboarding                  First-time setup — creates the first admin (only when no admin exists)
/                            Home — vertical stack: map (top) + filters + event feed (below)
/login                       Sign in
/signup                      Register

/profile/:username           Profile page — event history, stats
/settings                    Edit profile — display_name, avatar, language

/matches                     Browse matches with filters
/matches/new                 Create a new match
/matches/:id                 Match details — join, confirm, cancel

/trading                     Browse trading sessions with filters
/trading/new                 Create a new trading session
/trading/:id                 Trading session details — RSVP, view attendees

/tournaments                 Browse tournaments with filters
/tournaments/new             Create a new tournament
/tournaments/:id             Tournament details — bracket view, registration
/tournaments/:id/manage      Organizer panel — check-in, publish, start, report match results (P1 Wins, P2 Wins, Walkover)

/stores                      Game store list + map view
/stores/new                  Create a new game store
/stores/:id                  Store details — events at this store
/stores/:id/settings         Store settings — manage members, transfer ownership

/admin                       Admin dashboard
/admin/tcgs                  Manage TCGs
/admin/tcgs/:id/formats      Manage formats for a TCG
/admin/stores                Manage game stores — verify/suspend/delete
/admin/stores/:id            Store detail and membership management
/admin/users                 Manage users — ban/unban, promote to admin
/admin/reports               Moderation report queue
/admin/audit                 Audit log
```

## Layout Structure

| Layout       | Routes                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `MainLayout` | `/`, `/login`, `/signup`, `/profile/:username`, `/settings`, `/matches/*`, `/trading/*`, `/tournaments/*`, `/stores/*`, `/admin/*` |

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
        SiteBranch, MainNavigation, AdminNavigation
    organisms/               — Feature-specific sections
      home/
        EventMap, FilterBar, EventFeed, GeolocateButton
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

## Home Page Layout (Vertical Stack)

The home page (`/`) is a vertical stack answering where, what, and how to participate.

```
┌─────────────────────────────────────┐
│ Header: logo + dark/locale controls │
├─────────────────────────────────────┤
│                                     │
│              Map                    │
│         (Leaflet, rounded)          │
│                                     │
├─────────────────────────────────────┤
│ Filter bar: [Match] [Trading] [T]   │
│        [Find near me]               │
├─────────────────────────────────────┤
│  Event Feed                         │
│  • MTG Cmd        15 min · Store X  │
│  • Pokémon T      Today 3pm         │
│  • Standard T     Sat 10am · Store Y │
└─────────────────────────────────────┘
```

- **All viewports**: map on top, filter bar below, event feed at the bottom
- **Filter bar**: compact event type pills (Matches, Trading, Tournaments) plus "Find near me" geolocation button
- **Map**: rounded container, color-coded markers by event type (match, trading, tournament), click for preview popup
- **Geolocation**: text button next to filters; defaults to Fortaleza until permission granted
- **Feed items**: bordered rows with event type badge, name, relative time; no cards
- **Create**: created via list-page actions or header actions (not a FAB)

## App Shell

The application uses a single responsive shell inspired by `artemisluna.com.br`.

```
┌─────────────────────────────────────────────────────────────────┐
│ [≡] TCG Matchmaker                          [theme] [EN] [user] │  fixed navbar (h-12)
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│  Home    │                                                      │
│  Matches │              Main content area                       │
│  Trading │                                                      │
│  Tournaments│            (max-width centered)                   │
│  Stores  │                                                      │
│  ▼ Admin │                                                      │
│    Dashboard│                                                   │
│    TCGs  │                                                      │
│    Users │                                                      │
│    ...   │                                                      │
│          │                                                      │
│  ────────│                                                      │
│  © Luna  │                                                      │
│  G. Cezar│                                                      │
└──────────┴──────────────────────────────────────────────────────┘
   sidebar (lg+)         main content (border-right on lg+)
```

- **Navbar**: fixed top bar, centered within a max-width container (`lg:w-3/4`, `xl:w-2/3`, `2xl:w-4/7`), translucent with backdrop blur, border-bottom.
- **Sidebar**: sticky left panel on large screens (`lg` and up) holding the navigation tree and a copyright footer.
- **Mobile drawer**: below the navbar on small screens, reuses the same navigation tree; includes dark mode and locale controls.
- **Navigation tree**: `SiteBranch` recursively renders links and expands child links when the current route is inside the parent path.
- **Admin branch**: visible only to authenticated admins; expands automatically when the user is inside `/admin/*`.

## Geolocate Button

- A "Find near me" button on the home page (/)
- Uses browser `navigator.geolocation.getCurrentPosition()`
- On success: centers map on user coordinates, sorts events by distance
- On error/denied: shows a toast, keeps current map center
- Requires HTTPS for Geolocation API to work (Cloudflare Pages provides this)

## Auth Guards

- **Onboarding**: `/onboarding` — accessible only while no admin exists; redirects to `/` if any admin exists
- **Public**: `/`, `/login`, `/signup`, `/profile/:username`, `/stores`, `/stores/:id`, `/matches/:id`, `/trading/:id`, `/tournaments/:id`
- **Authenticated**: `/settings`, `/matches/new`, `/trading/new`, `/matches/:id/join`, `/trading/:id/rsvp`, `/tournaments/:id/register`
- **Organizer**: `/tournaments/new`, `/tournaments/:id/manage`
- **Store Member**: `/stores/:id/settings`
- **Admin**: `/admin/*`

## Notes

- `/onboarding` redirects to `/` once an admin user exists
- `/matches/new`, `/trading/new`, `/tournaments/new` redirect unauthenticated users to `/login`
- `/admin/*` redirects non-admin users to `/`
- `/tournaments/:id/manage` redirects non-organizer to `/tournaments/:id`
- All event types (matches, trading, tournaments) share the unified `events` table but have type-specific pages

## SEO & Metadata

Public pages use a **hybrid SEO strategy** (not full SSR):

1. **Quasar Meta plugin** injects `<title>`, `<meta name="description">`, OpenGraph, Twitter Card, and JSON-LD client-side. This works for users and social scrapers that run JavaScript.
2. **Prerendered static routes** at build time: `/`, `/login`, `/signup`, `/stores`, and legal pages.
3. **Dynamic rendering for crawlers**: a Cloudflare Worker detects crawler user-agents, fetches data from the Hono API, and returns a minimal HTML shell with the correct meta tags and JSON-LD for detail pages.

**Detail pages** (`/matches/:id`, `/trading/:id`, `/tournaments/:id`, `/stores/:id`, `/profile/:username`) are the highest priority for SEO and get their dynamic meta from the crawler renderer.

- **Canonical URLs**: each page sets its canonical URL to avoid duplicate content.
- **`/sitemap.xml`** lists all public indexable routes and detail pages.
- **`/robots.txt`** controls crawler access.
- **JSON-LD**: injected into `<head>` for events, stores, and the platform organization.
- **HTML `lang`**: updated via Quasar i18n / Vue Router to match `pt-BR` or `en-US`.

Admin routes, auth routes, and creation forms are `noindex` and disallowed in `robots.txt`.
