<template>
  <AppDetailLayout :item="tournament" width="800px">
    <TournamentManageHeader
      :tournament="tournament"
      :loading="busy"
      @publish="publish"
      @start="startTournament"
    />
    <ParticipantListSection :participants="participants" @check-in="checkIn" />
    <BracketMatchSection :matches="bracketMatches" @report="reportMatch" @walkover="walkover" />
  </AppDetailLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import BracketMatchSection, {
  type BracketRow,
} from '@/components/organisms/tournament/BracketMatchSection.vue';
import ParticipantListSection, {
  type Participant,
} from '@/components/organisms/tournament/ParticipantListSection.vue';
import TournamentManageHeader from '@/components/organisms/tournament/TournamentManageHeader.vue';
import { apiPost } from '@/composables/useApi';
import { usePageMeta } from '@/composables/usePageMeta';
import { useParticipants } from '@/composables/useParticipants';
import { useTournamentBracket } from '@/composables/useTournamentBracket';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';
import { useEventStore } from '@/stores/useEventStore';

const route = useRoute();
const store = useEventStore();
const tournamentId = route.params.id as string;

const busy = ref(false);
const tournament = computed(() => store.current as Record<string, string> | null);
const { participants, loadParticipants } = useParticipants(tournamentId);
const { matches, loadBracket } = useTournamentBracket(tournamentId);

const bracketMatches = computed<BracketRow[]>(() =>
  matches.value.map(
    (m) =>
      ({
        id: m.id,
        player1: m.player1 ?? undefined,
        player2: m.player2 ?? undefined,
        winner: m.winner ?? undefined,
        status: m.status ?? undefined,
        score1: m.score1,
        score2: m.score2,
      }) as BracketRow,
  ),
);

usePageMeta({ title: `Manage: ${tournament.value?.name || ''}` });

async function publish() {
  busy.value = true;
  try {
    await apiPost(`/api/tournaments/${tournamentId}/publish`);
    await store.get(tournamentId);
  } finally {
    busy.value = false;
  }
}

async function startTournament() {
  busy.value = true;
  try {
    await apiPost(`/api/tournaments/${tournamentId}/start`);
    await store.get(tournamentId);
    await loadBracket();
  } finally {
    busy.value = false;
  }
}

async function checkIn(userId: string) {
  await apiPost(`/api/tournaments/${tournamentId}/check-in`, { user_id: userId });
  await loadParticipants();
}

async function reportMatch(m: BracketRow) {
  const winnerId = (m.score1 ?? 0) > (m.score2 ?? 0) ? m.player1 : m.player2;
  if (!winnerId) return;
  await apiPost(`/api/bracket-matches/${m.id}/report`, {
    winner_id: winnerId,
    score_player1: Number(m.score1 || 0),
    score_player2: Number(m.score2 || 0),
  });
  await loadBracket();
}

async function walkover(matchId: string, winnerId: string) {
  if (!winnerId) return;
  await apiPost(`/api/bracket-matches/${matchId}/walkover`, { winner_id: winnerId });
  await loadBracket();
}

onMounted(async () => {
  await store.get(tournamentId);
  await loadParticipants();
  if (tournament.value?.status === 'in_progress') await loadBracket();
});
</script>
