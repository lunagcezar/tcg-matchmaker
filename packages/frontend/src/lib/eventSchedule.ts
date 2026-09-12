import { MAX_EVENT_HORIZON_MS } from '@tcg/shared';

export type ScheduledAtError = 'in_past' | 'too_far' | null;

export function scheduledAtError(iso: string, now: number = Date.now()): ScheduledAtError {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return null;
  if (timestamp <= now) return 'in_past';
  if (timestamp > now + MAX_EVENT_HORIZON_MS) return 'too_far';
  return null;
}
