---
title: i18n Audit — Replace Hardcoded Strings with $t() Translations
version: 1.0
date_created: 2026-07-14
tags: frontend, i18n, translation
---

# Introduction

This specification audits all pages for hardcoded English text and replaces them with `$t()` calls from vue-i18n so that switching between en-US and pt-BR works correctly.

## 1. Scope

- Audit all 20+ page components for hardcoded strings
- Expand i18n translation files (en-US + pt-BR) with missing keys
- Update pages to use `$t()` or `useI18n()`
- Preserve existing pages that already use `$t()` (auth pages)
