---
title: Store Pages — List, Create, Detail, Settings
version: 1.0
date_created: 2026-07-14
tags: frontend, stores, pages
---

# Introduction

This specification implements the store management pages: browse stores, create new stores, view store details with members, and manage store settings.

## 1. Purpose & Scope

**Purpose:** Implement the four store pages using the existing `useStoreStore` Pinia store.

**Scope:**

- `StoreListPage` — browse stores with search and city filter
- `StoreCreatePage` — create form with location autocomplete (Nominatim)
- `StoreDetailPage` — view store info and members
- `StoreSettingsPage` — edit store details and manage members

**Components created:**

- `LocationPicker` organism — address autocomplete + map preview
- `MemberList` molecule — list of store members with roles
