export const ROLES = ['player', 'organizer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const STORE_MEMBERSHIP_ROLES = ['owner', 'manager', 'staff'] as const;
export type StoreMembershipRole = (typeof STORE_MEMBERSHIP_ROLES)[number];
