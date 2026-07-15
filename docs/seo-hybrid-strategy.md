# SEO Hybrid Strategy

## Overview

This project does **not** use full SSR. Instead, a three-layer hybrid approach provides SEO coverage for crawlers at different capability levels. The strategy prioritizes simplicity and edge performance over a full server-side rendering setup.

```
Layer 1: Quasar Meta Plugin  ───  JS-capable crawlers (Googlebot, social scrapers)
Layer 2: Prerendered Routes   ───  Static public pages (build-time)
Layer 3: Pages Functions      ───  Non-JS crawlers on detail pages (edge)
```

---

## Layer 1 — Quasar Meta Plugin

**Scope:** All pages.  
**When it fires:** Client-side, after Vue mounts.  
**What it does:** Sets `<title>`, `<meta name="description">`, OpenGraph, Twitter Card, and JSON-LD tags dynamically per route using Quasar's `useMeta()` composable.

### Implementation

The `usePageMeta` composable (`src/composables/usePageMeta.ts`) wraps `useMeta()` and accepts either i18n keys or literal strings:

```ts
// Static page — uses i18n keys
usePageMeta({ titleKey: 'meta.home', descKey: 'meta.homeDesc' });

// Dynamic page — uses literal strings
usePageMeta({ title: `@${username}`, description: `View ${username}'s events` });
```

The composable injects:

- `<title>{title} | TCG Matchmaker</title>` with template suffix
- `<meta name="description">`
- `og:title`, `og:description`, `og:image`, `og:type`
- `twitter:card`, `twitter:title`, `twitter:description`

### i18n

All static page meta strings are translated in both `en-US` and `pt-BR` under the `meta.*` keys. The `lang` attribute on `<html>` is managed by Quasar's i18n integration and switches with the user's locale preference.

### Coverage

| Page                 | Meta Source              |
| -------------------- | ------------------------ |
| `/` (home)           | i18n key                 |
| `/login`             | i18n key                 |
| `/signup`            | i18n key                 |
| `/onboarding`        | i18n key                 |
| `/matches`           | i18n key                 |
| `/trading`           | i18n key                 |
| `/tournaments`       | i18n key                 |
| `/stores`            | i18n key                 |
| `/settings`          | i18n key                 |
| `/profile/:username` | Literal string (dynamic) |
| `/matches/:id`       | Literal string (dynamic) |
| `/trading/:id`       | Literal string (dynamic) |
| `/tournaments/:id`   | Literal string (dynamic) |
| `/stores/:id`        | Literal string (dynamic) |

### Limitation

Crawlers that do not execute JavaScript (legacy crawlers, some link previewers) never see these tags. Layer 2 and Layer 3 address this.

---

## Layer 2 — Prerendered Routes

**Scope:** Static public routes only.  
**When it fires:** Build time (Quasar build generates static HTML snapshots).  
**What it does:** Produces pre-rendered HTML files for routes that don't change per-user, ensuring instant content for both crawlers and users on first load.

### Routes prerendered

| Route     | Why                        |
| --------- | -------------------------- |
| `/`       | Home page, highest traffic |
| `/login`  | Auth entry point           |
| `/signup` | Registration               |
| `/stores` | Store listing              |

### Implementation

Prerendering is configured via Quasar's build system. The build generates static HTML files at these paths in the output directory, which Cloudflare Pages serves directly without invoking a Function.

---

## Layer 3 — Pages Functions (Dynamic Rendering)

**Scope:** Public detail pages when requested by crawlers.  
**When it fires:** Edge (Cloudflare Pages), before the SPA loads.  
**What it does:** Detects crawler User-Agents, fetches entity data from the Hono API, and returns a minimal HTML shell with correct meta tags and JSON-LD. Non-crawler requests pass through to the SPA.

### Implementation

A Cloudflare Pages Function at `packages/frontend/functions/_middleware.ts` intercepts all requests:

```
Request → Pages Function
  ├─ User-Agent matches crawler pattern?
  │   ├─ Yes → Parse URL path
  │   │   ├─ /matches/:id, /trading/:id, /tournaments/:id
  │   │   │   → fetch /api/events/:id → render Event HTML shell + JSON-LD
  │   │   ├─ /stores/:id
  │   │   │   → fetch /api/stores/:id → render LocalBusiness HTML shell + JSON-LD
  │   │   └─ /profile/:username
  │   │       → render Profile HTML shell
  │   └─ No  → context.next() (serve SPA normally)
  ├─ /robots.txt
  │   → Return robots.txt content
  └─ /sitemap.xml
      → Return sitemap XML (static + dynamic entries)
```

### Crawler Detection

The function checks the `User-Agent` header against known crawler patterns:

```ts
const CRAWLER_PATTERNS = [
  /Googlebot/i,
  /Bingbot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /WhatsApp/i,
  /Applebot/i,
  /SemrushBot/i,
  /PetalBot/i,
  // ... 15+ patterns total
];
```

Only public detail pages trigger the dynamic rendering — list pages, admin pages, and auth pages fall through to the SPA.

### HTML Shell

The shell is a minimal HTML5 document (no Vue, no JavaScript):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>{title} | TCG Matchmaker</title>
    <meta name="description" content="{description}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:url" content="{url}" />
    <meta property="og:type" content="{type}" />
    <meta name="twitter:card" content="summary" />
    <link rel="canonical" href="{url}" />
    <script type="application/ld+json">
      {jsonld}
    </script>
  </head>
  <body>
    <h1>{title}</h1>
    <p>{description}</p>
  </body>
</html>
```

### JSON-LD

Structured data is generated per entity type:

| Path                                               | Schema.org Type | Fields                                     |
| -------------------------------------------------- | --------------- | ------------------------------------------ |
| `/matches/:id`, `/trading/:id`, `/tournaments/:id` | `Event`         | name, description, startDate, location     |
| `/stores/:id`                                      | `LocalBusiness` | name, description, telephone, url, address |

### Error Handling

If the API fetch fails or the entity is not found, the function falls back to `context.next()` (fail open — serves the SPA). This ensures crawlers always see content even during transient API failures.

---

## Router Mode

The SPA uses **history mode** (`vueRouterMode: 'history'`) instead of hash mode. This is required for the server-side crawler function to detect the requested path (hash fragments are not sent to the server).

Cloudflare Pages is configured with a `_redirects` file that serves `index.html` for all unmatched routes, enabling direct URL access (e.g., navigating to `/matches/abc-123` in a browser serves the SPA which then resolves the route client-side):

```
/*    /index.html   200
```

---

## robots.txt & sitemap.xml

Both are served from the edge by the same Pages Function:

**`/robots.txt`** — Allows public pages, disallows admin/settings/creation pages:

```
User-agent: *
Allow: /
Allow: /matches/
Allow: /stores/
Allow: /profile/
Disallow: /admin/
Disallow: /settings
Disallow: /matches/new
Disallow: /login
Disallow: /signup
```

**`/sitemap.xml`** — Lists all indexable static routes with priority, plus fetches dynamic event and store IDs from the API to include detail page URLs (best-effort via `context.waitUntil`).

---

## Request Flow Diagram

```
Browser/crawler → Cloudflare Pages
  │
  ├─ /robots.txt ─────────────────→ Pages Function → robots.txt
  ├─ /sitemap.xml ────────────────→ Pages Function → sitemap.xml
  │
  ├─ Crawler on /matches/:id ─────→ Pages Function
  │                                   ├─ fetch API → data
  │                                   └─ return HTML shell + JSON-LD
  │
  └─ Regular browser on any path ──→ Pages Function
                                      └─ context.next()
                                         └─ Serve static asset (SPA index.html)
                                            └─ Vue mounts → usePageMeta sets tags
```

---

## Why not full SSR?

Full SSR (Nuxt, Quasar SSR mode) adds significant complexity:

- Requires a Node.js server running continuously
- Increases cost (server uptime vs edge functions)
- Slower TTFB for most users who don't need SSR

The hybrid approach gives 90%+ of SEO benefit with zero ongoing server cost:

- Googlebot executes JavaScript and sees Layer 1 tags
- Link previewers (Facebook, Twitter, WhatsApp) are detected by Layer 3
- Static pages load instantly via prerendering (Layer 2)
- Everything runs at the edge on Cloudflare's free tier
