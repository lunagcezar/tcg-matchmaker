import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useTournamentBracket } from '../useTournamentBracket';

vi.stubGlobal('fetch', vi.fn());

function mockBracket(matches: unknown[] | null) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: vi.fn().mockResolvedValue({ data: { matches }, error: null, meta: null }),
  });
}

describe('useTournamentBracket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('maps bracket matches to the normalized shape', async () => {
    mockBracket([
      {
        id: 'm1',
        round_number: 1,
        player1_id: 'player-aaa',
        player2_id: 'player-bbb',
        winner_id: 'player-aaa',
        status: 'completed',
        score_player1: 2,
        score_player2: 1,
      },
    ]);
    const { matches, loadBracket } = useTournamentBracket('t1');

    await loadBracket();

    expect(matches.value).toEqual([
      {
        id: 'm1',
        round: 1,
        player1: 'player-aaa',
        player2: 'player-bbb',
        winner: 'player-aaa',
        status: 'completed',
        score1: 2,
        score2: 1,
      },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tournaments/t1/bracket'),
      expect.anything(),
    );
  });

  it('defaults round to 1 and tolerates missing scores', async () => {
    mockBracket([{ id: 'm2', player1_id: 'p1', player2_id: null }]);
    const { matches, loadBracket } = useTournamentBracket('t1');

    await loadBracket();

    expect(matches.value[0]).toMatchObject({
      id: 'm2',
      round: 1,
      player2: null,
      score1: 0,
      score2: 0,
    });
  });

  it('keeps an empty list on missing or failing bracket data', async () => {
    mockBracket(null);
    const a = useTournamentBracket('t1');
    await a.loadBracket();
    expect(a.matches.value).toEqual([]);

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));
    const b = useTournamentBracket('t1');
    await expect(b.loadBracket()).resolves.toBeUndefined();
    expect(b.matches.value).toEqual([]);
  });
});
