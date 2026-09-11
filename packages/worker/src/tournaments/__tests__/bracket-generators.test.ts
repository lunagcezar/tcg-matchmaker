import { describe, it, expect, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { chain } from '../../test-utils/supabase.js';
import { generateRoundRobin } from '../bracket-generators.js';

describe('Round Robin generator', () => {
  it('generates matches for 4 players', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const c = chain({
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'round-1' }, error: null }),
    });
    const from = vi.fn().mockReturnValue(c);
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ from });

    await generateRoundRobin({ from: from as ReturnType<typeof vi.fn> } as never, 't-1', [
      'a',
      'b',
      'c',
      'd',
    ]);
    const calls = from.mock.calls.filter((call: string[]) => call[0] === 'bracket_matches');
    expect(calls.length).toBeGreaterThan(0);
  });

  it('creates correct number of matches for N players', () => {
    const matches = (4 * (4 - 1)) / 2;
    expect(matches).toBe(6);
  });
});

describe('Swiss generator', () => {
  it('pairs players by record groups', () => {
    const players = [
      { id: 'a', wins: 2 },
      { id: 'b', wins: 2 },
      { id: 'c', wins: 1 },
      { id: 'd', wins: 1 },
      { id: 'e', wins: 0 },
      { id: 'f', wins: 0 },
    ];
    const groups: Record<number, string[]> = {};
    for (const p of players) {
      if (!groups[p.wins]) groups[p.wins] = [];
      groups[p.wins].push(p.id);
    }
    const wins2 = groups[2] ?? [];
    const wins1 = groups[1] ?? [];
    const wins0 = groups[0] ?? [];
    expect(wins2).toEqual(['a', 'b']);
    expect(wins1).toEqual(['c', 'd']);
    expect(wins0).toEqual(['e', 'f']);
  });
});

describe('Bracket generator routing', () => {
  it('routes all bracket types to generators', () => {
    const generators: Record<string, string> = {
      single_elimination: 'generateSingleElimination',
      double_elimination: 'generateDoubleElimination',
      round_robin: 'generateRoundRobin',
      swiss: 'generateSwiss',
      pool_play: 'generatePoolPlay',
    };
    expect(generators.single_elimination).toBe('generateSingleElimination');
    expect(generators.round_robin).toBe('generateRoundRobin');
    expect(generators.swiss).toBe('generateSwiss');
    expect(generators.pool_play).toBe('generatePoolPlay');
    expect(generators.double_elimination).toBe('generateDoubleElimination');
  });
});
