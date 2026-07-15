---
title: Internationalized Meta Tags
version: 1.0
date_created: 2026-07-15
tags: frontend, i18n, seo
---

# Internationalized Meta Tags

## 1. Purpose & Scope

Internationalize all SEO meta tags so that page titles and descriptions are translated according to the user's selected language (en-US or pt-BR). This builds on the `usePageMeta` composable to use i18n key-based lookups for all static pages.

## 2. Definitions

| Term      | Definition                                                                             |
| --------- | -------------------------------------------------------------------------------------- |
| i18n meta | Meta tags whose content is derived from translation keys rather than hardcoded strings |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: All static page meta tags use i18n keys instead of hardcoded strings
- **REQ-002**: `usePageMeta` accepts `titleKey` and `descKey` which resolve via `useI18n().t()` at render time
- **REQ-003**: English and Portuguese translation files each have `meta.*` entries for every page (home, matches, trading, stores, login, signup, onboarding, settings)
- **REQ-004**: Dynamic pages (profile, event detail) use `title`/`description` literal strings instead of keys, since their content is user-specific
- **REQ-005**: The `lang` attribute on `<html>` updates when the user switches locale (handled by Quasar i18n integration)
- **CON-001**: Meta section in i18n files follows the naming pattern `meta.{pageKey}` and `meta.{pageKey}Desc`

## 4. Acceptance Criteria

- **AC-001**: Given a user has selected English, When they visit the home page, Then the page title is "Home | TCG Matchmaker"
- **AC-002**: Given a user has selected Portuguese, When they visit the home page, Then the page title is "Início | TCG Matchmaker"
- **AC-003**: Given a user switches language, When the page re-renders, Then the title and description update to match the new locale
- **AC-004**: Given a user visits a dynamic page (e.g., profile), When the page renders, Then the title uses the dynamic content regardless of locale

## 5. Dependencies

- `usePageMeta` composable from spec-033
- i18n translation files (en-US and pt-BR)
