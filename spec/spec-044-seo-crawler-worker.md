---
title: SEO Crawler Worker — Dynamic Rendering
version: 1.0
date_created: 2026-07-15
tags: seo, worker, crawler, pages-functions
---

# SEO Crawler Worker

## 1. Purpose & Scope

Implement dynamic rendering for search engine crawlers as part of the hybrid SEO strategy (NFR-43). Crawlers that don't execute JavaScript won't see the SPA's meta tags. This spec implements Cloudflare Pages Functions that detect crawler user-agents on public detail pages and return a minimal HTML shell with correct meta tags, OpenGraph, Twitter Card, and JSON-LD.

Also includes `robots.txt` and `/sitemap.xml` generation at the edge.

## 2. Definitions

| Term           | Definition                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------ |
| Crawler        | Search engine bot (Googlebot, Bingbot, etc.) that doesn't execute JS                       |
| HTML shell     | Minimal HTML document with `<head>` meta tags but no app content                           |
| Hybrid SEO     | Three-layer strategy: Quasar Meta (JS) + prerender (static) + dynamic rendering (crawlers) |
| Pages Function | Cloudflare Pages serverless function running at the edge before static assets              |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Cloudflare Pages Functions intercept requests to public detail pages
- **REQ-002**: Functions detect crawlers via User-Agent header (Googlebot, Bingbot, FacebookExternalHit, Twitterbot, etc.)
- **REQ-003**: For crawlers on `/matches/:id`, `/trading/:id`, `/tournaments/:id` — fetch event data from Hono API and return HTML shell with meta tags + JSON-LD
- **REQ-004**: For crawlers on `/stores/:id` — fetch store data from Hono API and return HTML shell with meta tags + JSON-LD
- **REQ-005**: For crawlers on `/profile/:username` — fetch profile data from Hono API and return HTML shell with meta tags
- **REQ-006**: For non-crawler requests, call `next()` to serve the SPA normally
- **REQ-007**: Serve `/robots.txt` from the edge — allow public pages, disallow `/admin/*`, `/settings`, creation forms
- **REQ-008**: Serve `/sitemap.xml` from the edge with links to all indexable public routes
- **REQ-009**: Switch frontend router from hash to history mode (required for server-side URL detection)
- **REQ-010**: Add `_redirects` file for SPA fallback (all routes serve index.html)
- **CON-001**: Functions use Cloudflare Pages Functions v2 API (`onRequest`, `context.next()`)
- **CON-002**: Functions are placed in `packages/frontend/functions/` (auto-detected by Pages)
- **CON-003**: Error in crawler handler falls back to `next()` (fail open)

## 4. Interfaces

### Crawler detection

```ts
const CRAWLER_PATTERNS = [
  /Googlebot/i,
  /Bingbot/i,
  /Slurp/i,
  /DuckDuckBot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /WhatsApp/i,
  /Applebot/i,
  /SemrushBot/i,
];
```

### HTML shell template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>{title} | TCG Matchmaker</title>
    <meta name="description" content="{description}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:image" content="{image}" />
    <meta property="og:url" content="{url}" />
    <meta property="og:type" content="{type}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{description}" />
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

## 5. Acceptance Criteria

- **AC-001**: Given a crawler requests `/matches/abc-123`, When the User-Agent matches Googlebot, Then an HTML shell with the match title, description, OpenGraph tags, and JSON-LD is returned
- **AC-002**: Given a crawler requests `/stores/abc-123`, When the User-Agent matches Facebook crawler, Then an HTML shell with store details and JSON-LD is returned
- **AC-003**: Given a regular browser requests `/matches/abc-123`, When the function runs, Then `next()` is called and the SPA is served normally
- **AC-004**: Given a crawler requests `/robots.txt`, When the function runs, Then the robots.txt content is returned
- **AC-005**: Given any request to `/sitemap.xml`, When the function runs, Then an XML sitemap is returned
- **AC-006**: Given a frontend route like `/matches/abc-123` in a browser, When the SPA loads, Then the correct route is rendered (history mode)

## 6. Dependencies

- Backend Hono API endpoints (used by functions to fetch data for crawlers)
- Quasar Meta plugin (already implemented for JS-enabled clients)
- Cloudflare Pages Functions (at the edge)
