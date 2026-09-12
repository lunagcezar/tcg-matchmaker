import { MAX_EVENT_HORIZON_MS } from '@tcg/shared';
import { describe, it, expect } from 'vitest';

import { scheduledAtError } from '../eventSchedule';

const now = new Date('2026-09-12T12:00:00.000Z').getTime();

describe('scheduledAtError', () => {
  it('returns in_past for a past instant', () => {
    expect(scheduledAtError(new Date(now - 1000).toISOString(), now)).toBe('in_past');
  });

  it('returns in_past for exactly now (strict future)', () => {
    expect(scheduledAtError(new Date(now).toISOString(), now)).toBe('in_past');
  });

  it('returns too_far beyond the 1-year horizon', () => {
    const beyond = new Date(now + MAX_EVENT_HORIZON_MS + 1000).toISOString();
    expect(scheduledAtError(beyond, now)).toBe('too_far');
  });

  it('allows exactly the horizon boundary', () => {
    const boundary = new Date(now + MAX_EVENT_HORIZON_MS).toISOString();
    expect(scheduledAtError(boundary, now)).toBeNull();
  });

  it('returns null for a valid future instant', () => {
    expect(scheduledAtError(new Date(now + 86_400_000).toISOString(), now)).toBeNull();
  });

  it('returns null for empty and invalid input', () => {
    expect(scheduledAtError('', now)).toBeNull();
    expect(scheduledAtError('not-a-date', now)).toBeNull();
  });
});
