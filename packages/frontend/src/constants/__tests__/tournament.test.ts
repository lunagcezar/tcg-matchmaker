import { describe, expect, it } from 'vitest';
import { BEST_OF_OPTIONS, BRACKET_OPTIONS } from '../tournament';

describe('tournament constants', () => {
  it('BEST_OF_OPTIONS values are numbers', () => {
    for (const opt of BEST_OF_OPTIONS) {
      expect(typeof opt.value).toBe('number');
    }
  });

  it('BRACKET_OPTIONS values match CreateEventSchema bracket_type enum', () => {
    const values = BRACKET_OPTIONS.map((o) => o.value);
    expect(values).toContain('single_elimination');
    expect(values).toContain('double_elimination');
    expect(values).toContain('round_robin');
    expect(values).toContain('swiss');
    expect(values).toContain('pool_play');
  });
});
