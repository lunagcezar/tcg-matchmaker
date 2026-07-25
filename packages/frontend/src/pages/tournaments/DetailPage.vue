<template>
  <AppDetailLayout :item="tournament" :loading="loading" width="800px">
    <q-card>
      <q-card-section>
        <div class="row items-center">
          <h5 class="q-my-none">{{ tournament!.name || $t('tournament.details') }}</h5>
          <q-badge :color="badgeColor(tournament!.status)" class="q-ml-sm">{{
            tournament!.status
          }}</q-badge>
        </div>
        <div class="text-caption text-grey q-mt-sm">
          {{ $t('event.date') }}: {{ formatDate(tournament!.scheduled_at) }}
        </div>
      </q-card-section>
      <q-card-actions v-if="tournament!.status === 'open'" class="q-pa-md">
        <q-btn
          color="warning"
          :label="$t('tournament.register')"
          :loading="registering"
          @click="register"
        />
      </q-card-actions>
    </q-card>
    <q-card
      v-if="tournament!.status === 'in_progress' || tournament!.status === 'completed'"
      class="q-mt-md"
    >
      <q-card-section
        ><h6>{{ $t('tournament.bracket') }}</h6></q-card-section
      >
      <div ref="bracketRef" class="bracket-container"></div>
    </q-card>
    <q-card class="q-mt-md">
      <q-card-section
        ><h6>{{ $t('tournament.participants') }}</h6></q-card-section
      >
      <q-card-section v-if="participants.length === 0" class="text-grey">{{
        $t('tournament.noParticipants')
      }}</q-card-section>
      <q-list v-else>
        <q-item v-for="p in participants" :key="p.id as string">
          <q-item-section>{{
            (p as Participant).username || (p as Participant).user_id?.slice(0, 8)
          }}</q-item-section>
          <q-item-section side
            ><q-badge>{{ (p as Participant).status }}</q-badge></q-item-section
          >
        </q-item>
      </q-list>
    </q-card>
  </AppDetailLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { useBracketD3, type BracketMatch } from '@/composables/useBracketD3';
import { apiGet, apiPost } from '@/composables/useApi';
import { useFormatDate } from '@/composables/useFormatDate';
import { badgeColor } from '@/lib/colors';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';

const route = useRoute();
const { formatDate } = useFormatDate();
const store = useEventStore();
const tournamentId = route.params.id as string;
type Participant = Record<string, string>;

const participants = ref<Array<Record<string, unknown>>>([]);
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
    participants.value = (j.data ?? []) as Record<string, unknown>[];
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
