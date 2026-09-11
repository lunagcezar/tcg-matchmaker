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
    <q-card
      v-if="tournament!.status === 'in_progress' || tournament!.status === 'completed'"
      class="q-mt-md"
    >
      <q-card-section
        ><h6 class="q-my-none">{{ $t('tournament.bracket') }}</h6></q-card-section
      >
      <div ref="bracketRef" class="bracket-container"></div>
    </q-card>
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

import EventHeaderCard from '@/components/molecules/cards/EventHeaderCard.vue';
import ParticipantListCard, {
  type Participant,
} from '@/components/molecules/cards/ParticipantListCard.vue';
import { apiGet, apiPost } from '@/composables/useApi';
import { useBracketD3, type BracketMatch } from '@/composables/useBracketD3';
import { useFormatDate } from '@/composables/useFormatDate';
import { usePageMeta } from '@/composables/usePageMeta';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';
import { useEventStore } from '@/stores/useEventStore';

const route = useRoute();
const { formatDate } = useFormatDate();
const store = useEventStore();
const tournamentId = route.params.id as string;

const participants = ref<Participant[]>([]);
const registering = ref(false);
const bracketRef = ref<HTMLElement | null>(null);
const bracketMatches = ref<BracketMatch[]>([]);

const tournament = computed(() => store.current);
const loading = computed(() => store.loading);

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

async function loadBracket() {
  try {
    const j = await apiGet(`/api/tournaments/${tournamentId}/bracket`);
    const bracketData = j.data as Record<string, unknown> | null;
    if (bracketData?.matches) {
      bracketMatches.value = (bracketData.matches as Record<string, unknown>[]).map(
        (m: Record<string, unknown>) => ({
          id: m.id as string,
          round: (m.round_number as number) || 1,
          player1: (m.player1_id as string)?.slice(0, 8) || null,
          player2: (m.player2_id as string)?.slice(0, 8) || null,
          winner: (m.winner_id as string)?.slice(0, 8) || null,
        }),
      );
    }
  } catch {
    console.warn('bracket load failed');
  }
}

onMounted(async () => {
  await store.get(tournamentId);
  try {
    const j = await apiGet(`/api/events/${tournamentId}/participants`);
    participants.value = (j.data ?? []) as Participant[];
  } catch {
    console.warn('failed to load participants');
  }
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
