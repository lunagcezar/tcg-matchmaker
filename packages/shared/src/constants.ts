export const ROLES = ['player', 'organizer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const STORE_MEMBERSHIP_ROLES = ['owner', 'manager', 'staff'] as const;
export type StoreMembershipRole = (typeof STORE_MEMBERSHIP_ROLES)[number];

export const MAX_EVENT_HORIZON_MS = 365 * 24 * 60 * 60 * 1000;
