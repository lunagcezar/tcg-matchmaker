---
title: Settings — Account Management (Deletion, Suspension, Data Export)
version: 1.0
date_created: 2026-07-15
tags: frontend, settings, auth, lgpd
---

# Settings — Account Management

## 1. Purpose & Scope

Implement self-service account management on the Settings page: account deletion (FR-06, UC-03), account suspension (FR-09, UC-26), and LGPD data export (FR-67, UC-25). The Worker backend already provides the API endpoints (`DELETE /api/auth/account`, `POST /api/auth/suspend`, `POST /api/auth/export`) — this spec wires them into the frontend with proper confirmation dialogs, loading states, and error handling.

## 2. Definitions

| Term                  | Definition                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Account deletion      | Permanently removes Supabase Auth user; anonymizes `public.users` record; preserves event history via FK integrity |
| Account suspension    | Temporary block (`suspended_at` timestamp); user can log in again to reactivate                                    |
| Data export           | Returns user profile + consents as JSON download (LGPD portability)                                                |
| Last admin protection | The last remaining admin cannot delete their account                                                               |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Settings page shows a "Delete Account" section with a button that opens a confirmation dialog
- **REQ-002**: Confirmation dialog warns that deletion is irreversible and data will be anonymized
- **REQ-003**: After deletion, user is logged out and redirected to home
- **REQ-004**: If user is the last admin, deletion is rejected with a specific error message; the dialog shows this error
- **REQ-005**: Settings page shows a "Suspend Account" button that suspends and logs out the user
- **REQ-006**: Settings page shows a "Download My Data" button that triggers a JSON download
- **REQ-007**: All destructive actions show a Quasar dialog (`$q.dialog`) with Cancel/Confirm buttons
- **REQ-008**: Loading state shown during API calls; errors displayed as snackbar/toast messages
- **REQ-009**: i18n strings for all new UI text in both en-US and pt-BR
- **CON-001**: Must use existing Worker auth routes (no new backend changes)
- **CON-002**: Must use Quasar `QDialog` or `$q.dialog` for confirmation modals
- **CON-003**: Toast notifications via `$q.notify` for success/error feedback

## 4. Interfaces & Data Contracts

### Backend API (existing, no changes)

| Method | Path                | Description                        | Auth |
| ------ | ------------------- | ---------------------------------- | ---- |
| DELETE | `/api/auth/account` | Delete account + anonymize profile | JWT  |
| POST   | `/api/auth/suspend` | Set `suspended_at` on user         | JWT  |
| POST   | `/api/auth/export`  | Return profile + consents JSON     | JWT  |

### Response format (all three)

```json
{ "data": { "success": true } | UserProfile, "error": null | string, "meta": null }
```

### Error cases for DELETE /api/auth/account

```json
// Last admin protection
{ "data": null, "error": "Promote another admin before deleting your account", "meta": null }
```

## 5. Acceptance Criteria

- **AC-001**: Given an authenticated user on the settings page, When they click "Delete Account", Then a confirmation dialog appears with a warning message
- **AC-002**: Given the confirmation dialog is open, When the user clicks "Cancel", Then the dialog closes with no action taken
- **AC-003**: Given the confirmation dialog is open, When the user clicks "Confirm Delete", Then DELETE /api/auth/account is called, the user is logged out, and redirected to /
- **AC-004**: Given the user is the last admin, When they attempt to delete their account, Then the API returns an error and the dialog displays "Promote another admin before deleting your account"
- **AC-005**: Given an authenticated user on the settings page, When they click "Download My Data", Then POST /api/auth/export is called and a JSON file is downloaded
- **AC-006**: Given an authenticated user on the settings page, When they click "Suspend Account", Then POST /api/auth/suspend is called and the user is logged out

## 6. Test Automation Strategy

- **Test Levels**: Unit tests for the settings page (Vitest + @vue/test-utils)
- **Frameworks**: Vitest, MSW for API mocking
- **Coverage**: Mock fetch for delete/suspend/export calls, verify dialogs open

## 7. Rationale & Context

Account management is a core user feature and LGPD requirement. The backend endpoints already exist — only the frontend UI wiring is missing. Confirmation dialogs are critical for destructive actions to prevent accidental deletion.

## 8. Dependencies & External Integrations

### Backend API (existing)

- `DELETE /api/auth/account` — with last-admin protection
- `POST /api/auth/suspend` — sets suspended_at
- `POST /api/auth/export` — returns profile + consents

## 9. Examples & Edge Cases

**Edge cases:**

- Last admin tries to delete: show error, block deletion
- Network error during deletion: show toast, do not log out
- Data export returns large dataset: browser downloads as JSON file
- Suspended user can log in again (that's backend behavior, frontend just suspends and logs out)

## 10. Validation Criteria

- Spec-041 settings page allows account deletion with confirmation
- Last admin cannot delete their account (error shown)
- Data export triggers JSON download
- Account suspension logs user out
- All strings translated to pt-BR

## 11. Related Specifications

- spec-002-auth-system
- spec-031-settings-page (existing settings page implementation)
