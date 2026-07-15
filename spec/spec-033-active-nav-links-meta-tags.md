---
title: Active Nav Links + SEO Meta Tags
version: 1.0
date_created: 2026-07-15
tags: frontend, navigation, seo
---

# Active Nav Links + SEO Meta Tags

## 1. Purpose & Scope

Add active link styling to navigation items and inject SEO meta tags (title, description) on all pages using Quasar's Meta plugin and the `usePageMeta` composable.

## 2. Definitions

| Term            | Definition                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| Active nav link | Navigation button that appears bold when its route matches the current URL |
| Meta tags       | `<title>`, `<meta name="description">`, OpenGraph, and Twitter Card tags   |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Header nav buttons use `active-class="text-weight-bold"` to indicate the current page
- **REQ-002**: Each page calls `usePageMeta()` with a `titleKey` (i18n) and `descKey` to set unique `<title>` and `<meta name="description">`
- **REQ-003**: The `usePageMeta` composable sets OpenGraph tags (`og:title`, `og:description`, `og:image`) and Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`)
- **REQ-004**: The title template appends `| TCG Matchmaker` to every page title
- **REQ-005**: `usePageMeta` is a factory function that accepts either i18n key strings (titleKey, descKey) or literal strings (title, description)
- **REQ-006**: Nav items support an `exact` property for routes like `/` to prevent matching all sub-paths
- **CON-001**: Uses Quasar's `useMeta` composable under the hood
- **CON-002**: Page creator uses i18n keys for localized titles via `useI18n`

## 4. Interfaces

```ts
interface PageMeta {
  titleKey?: string; // i18n key for title
  title?: string; // literal title (overrides titleKey)
  descKey?: string; // i18n key for description
  description?: string; // literal description
  image?: string; // OpenGraph image URL
  type?: string; // OpenGraph type
}
```

## 5. Acceptance Criteria

- **AC-001**: Given a user navigates between pages, When the route changes, Then the active nav link is bold
- **AC-002**: Given a user visits any page, When the page renders, Then the browser title is set to `"Page Name | TCG Matchmaker"`
- **AC-003**: Given a user visits any page, When inspecting the page source, Then `<meta name="description">` is present with the correct content
- **AC-004**: Given a user shares a page link on social media, When the crawler inspects the page, Then OpenGraph and Twitter Card tags are present

## 6. Dependencies

- Quasar Meta plugin
- `useI18n` for localized titles
