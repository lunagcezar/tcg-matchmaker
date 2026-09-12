import { ref, type Ref } from 'vue';

import { apiGet } from '@/composables/useApi';

export interface TournamentBracketMatch {
  id: string;
  round: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  status: string | null;
  score1: number;
  score2: number;
}

export interface BracketState {
  matches: Ref<TournamentBracketMatch[]>;
  loading: Ref<boolean>;
  loadBracket: () => Promise<void>;
}

export function useTournamentBracket(tournamentId: string): BracketState {
  const matches = ref<TournamentBracketMatch[]>([]) as Ref<TournamentBracketMatch[]>;
  const loading = ref(false);

  async function loadBracket() {
    loading.value = true;
    try {
      const j = await apiGet(`/api/tournaments/${tournamentId}/bracket`);
      const bracketData = j.data as Record<string, unknown> | null;
      const raw = (bracketData?.matches ?? []) as Record<string, unknown>[];
      matches.value = raw.map((m) => ({
        id: m.id as string,
        round: (m.round_number as number) || 1,
        player1: (m.player1_id as string | null) ?? null,
        player2: (m.player2_id as string | null) ?? null,
        winner: (m.winner_id as string | null) ?? null,
        status: (m.status as string | null) ?? null,
        score1: (m.score_player1 as number) ?? 0,
        score2: (m.score_player2 as number) ?? 0,
      }));
    } catch {
      console.warn('failed to load bracket');
    } finally {
      loading.value = false;
    }
  }

  return { matches, loading, loadBracket };
}
