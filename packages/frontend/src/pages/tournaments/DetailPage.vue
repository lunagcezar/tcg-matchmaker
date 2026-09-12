<template>
  <AppDetailLayout :item="tournament" :loading="loading">
    <EventHeaderCard
      :title="tournament!.name || $t('tournament.details')"
      :status="tournament!.status"
      :participation="null"
    >
      <div class="text-caption text-grey q-mt-sm">
        {{ $t('event.date') }}: {{ formatDate(tournament!.scheduled_at) }}
      </div>
      <template #actions>
        <q-btn
          v-if="tournament!.status === 'open'"
          color="warning"
          :label="$t('tournament.register')"
          :loading="registering"
          @click="register"
        />
      </template>
    </EventHeaderCard>
    <AppPanelCard
      v-if="tournament!.status === 'in_progress' || tournament!.status === 'completed'"
      :title="$t('tournament.bracket')"
      card-class="q-mt-md"
    >
      <div ref="bracketRef" class="bracket-container"></div>
    </AppPanelCard>
    <ParticipantListCard
      :title="$t('tournament.participants')"
      :participants="participants"
      :empty-text="$t('tournament.noParticipants')"
    />
  </AppDetailLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import AppPanelCard from '@/components/molecules/cards/AppPanelCard.vue';
import EventHeaderCard from '@/components/molecules/cards/EventHeaderCard.vue';
import ParticipantListCard from '@/components/molecules/cards/ParticipantListCard.vue';
import { apiPost } from '@/composables/useApi';
import { useBracketD3, type BracketMatch } from '@/composables/useBracketD3';
import { useFormatDate } from '@/composables/useFormatDate';
import { usePageMeta } from '@/composables/usePageMeta';
import { useParticipants } from '@/composables/useParticipants';
import { useTournamentBracket } from '@/composables/useTournamentBracket';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';
import { useEventStore } from '@/stores/useEventStore';

const route = useRoute();
const { formatDate } = useFormatDate();
const store = useEventStore();
const tournamentId = route.params.id as string;

const registering = ref(false);
const bracketRef = ref<HTMLElement | null>(null);

const tournament = computed(() => store.current);
const loading = computed(() => store.loading);
const { participants, loadParticipants } = useParticipants(tournamentId);
const { matches, loadBracket } = useTournamentBracket(tournamentId);

const bracketMatches = computed<BracketMatch[]>(() =>
  matches.value.map((m) => ({
    id: m.id,
    round: m.round,
    player1: m.player1?.slice(0, 8) ?? null,
    player2: m.player2?.slice(0, 8) ?? null,
    winner: m.winner?.slice(0, 8) ?? null,
  })),
);

usePageMeta({ title: tournament.value?.name || 'Tournament' });
useBracketD3(bracketRef, bracketMatches);

async function register() {
  registering.value = true;
  try {
    await apiPost(`/api/tournaments/${tournamentId}/register`);
    await store.get(tournamentId);
  } finally {
    registering.value = false;
  }
}

onMounted(async () => {
  await store.get(tournamentId);
  await loadParticipants();
  if (tournament.value?.status === 'in_progress' || tournament.value?.status === 'completed') {
    await loadBracket();
  }
});
</script>

<style scoped>
.bracket-container {
  min-height: 300px;
  overflow-x: auto;
}
</style>
