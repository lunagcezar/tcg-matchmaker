---
title: Extract Shared Utilities to src/lib/
version: 1.0
date_created: 2026-07-15
tags: frontend, refactoring, dry
---

# Extract Shared Utilities to src/lib/

## 1. Purpose & Scope

Eliminate massive duplication across the frontend by extracting shared utility functions into a `src/lib/` directory. Currently, `import.meta.env.VITE_API_URL` is redeclared in 28 files, `formatDate` in 7 files, `badgeColor` in 6 files, and various other helpers are duplicated across pages.

## 2. Definitions

| Term | Definition                                                         |
| ---- | ------------------------------------------------------------------ |
| lib/ | Directory for pure utility functions (no Vue reactivity, no Pinia) |

## 3. Files to Create

| File                | Exports                                                                                                   | Replaces                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/lib/api.ts`    | `getApiBase()`                                                                                            | 28 inline `apiUrl` declarations                            |
| `src/lib/format.ts` | `formatDate()`, `relativeTime()`                                                                          | 7 inline `formatDate`, 2 `formattedDate`                   |
| `src/lib/colors.ts` | `badgeColor()`, `statusColor()`, `roleColor()`, `eventColor()`, `memberRoleColor()`, `matchStatusColor()` | 6 `badgeColor`, 2 `statusColor`, scattered color functions |
| `src/lib/router.ts` | `eventRoute()`                                                                                            | 2 inline `eventRoute`/`detailRoute`                        |

## 4. Acceptance Criteria

- **AC-001**: `getApiBase()` returns `import.meta.env.VITE_API_URL || 'http://localhost:8787'` — single source of truth
- **AC-002**: `formatDate()` uses `toLocaleDateString()` consistently across all callers
- **AC-003**: All 28 `apiUrl` redeclarations replaced with `getApiBase()`
- **AC-004**: All 7 `formatDate` redefinitions replaced with `formatDate()`
- **AC-005**: All color mapping functions centralized, no inline redefinitions
- **AC-006**: All tests still pass, lint clean
