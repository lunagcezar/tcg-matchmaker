export const ROLES = ['player', 'organizer', 'admin'] as const;
export type Role = (typeof ROLES)[number];
