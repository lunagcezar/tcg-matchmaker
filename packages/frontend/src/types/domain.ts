import type { Event, Store, StoreMembership, Notification } from '@tcg/shared';

export type { Event, Store, StoreMembership, Notification };

export interface Participant {
  id: string;
  user_id?: string;
  username?: string;
  status?: string;
  role?: string;
}
