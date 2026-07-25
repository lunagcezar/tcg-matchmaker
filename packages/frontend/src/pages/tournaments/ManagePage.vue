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
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { apiGet, apiPost } from '@/composables/useApi';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';
import TournamentManageHeader from '@/components/organisms/tournament/TournamentManageHeader.vue';
import ParticipantListSection, {
  type Participant,
} from '@/components/organisms/tournament/ParticipantListSection.vue';
import BracketMatchSection, {
  type BracketRow,
} from '@/components/organisms/tournament/BracketMatchSection.vue';

const route = useRoute();
const store = useEventStore();
const tournamentId = route.params.id as string;

const busy = ref(false);
const participants = ref<Participant[]>([]);
const bracketMatches = ref<BracketRow[]>([]);

const tournament = computed(() => store.current as Record<string, string> | null);
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

async function loadParticipants() {
  try {
    const j = await apiGet(`/api/events/${tournamentId}/participants`);
    participants.value = (j.data ?? []) as Participant[];
  } catch {
    console.warn('failed to load participants');
  }
}

async function loadBracket() {
  try {
    const j = await apiGet(`/api/tournaments/${tournamentId}/bracket`);
    const bracketData = j.data as Record<string, unknown> | null;
    bracketMatches.value = ((bracketData?.matches ?? []) as Record<string, unknown>[]).map(
      (m: Record<string, unknown>) => ({
        id: m.id as string,
        player1: m.player1_id as string | undefined,
        player2: m.player2_id as string | undefined,
        winner: m.winner_id as string | undefined,
        status: m.status as string | undefined,
        score1: (m.score_player1 as number) ?? 0,
        score2: (m.score_player2 as number) ?? 0,
      }),
    ) as BracketRow[];
  } catch {
    console.warn('failed to load bracket');
  }
}

onMounted(async () => {
  await store.get(tournamentId);
  await loadParticipants();
  if (tournament.value?.status === 'in_progress') await loadBracket();
});
</script>
