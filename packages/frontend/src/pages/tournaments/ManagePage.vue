<template>
  <q-page class="q-pa-md row justify-center">
    <div v-if="tournament" style="width: 800px">
      <q-card>
        <q-card-section>
          <h5 class="q-my-none">{{ $t('tournament.manage') }}: {{ tournament.name }}</h5>
          <q-badge :color="badgeColor(tournament.status)" class="q-mt-sm">{{
            tournament.status
          }}</q-badge>
        </q-card-section>
        <q-card-actions class="q-pa-md q-gutter-sm">
          <q-btn
            v-if="tournament.status === 'draft'"
            color="primary"
            :label="$t('tournament.publish')"
            :loading="busy"
            @click="publish"
          />
          <q-btn
            v-if="tournament.status === 'open'"
            color="warning"
            :label="$t('tournament.start')"
            :loading="busy"
            @click="startTournament"
          />
        </q-card-actions>
      </q-card>

      <q-card class="q-mt-md">
        <q-card-section
          ><h6>{{ $t('tournament.checkIn') }}</h6></q-card-section
        >
        <q-card-section class="row q-col-gutter-sm">
          <q-input v-model="checkInUserId" label="User ID" outlined dense class="col" />
          <q-btn
            color="positive"
            :label="$t('tournament.checkIn')"
            class="col-auto"
            @click="checkIn"
          />
        </q-card-section>
        <q-list>
          <q-item v-for="p in participants" :key="p.id as string">
            <q-item-section>{{ (p as Participant).user_id?.slice(0, 8) }}</q-item-section>
            <q-item-section side
              ><q-badge>{{ (p as Participant).status }}</q-badge></q-item-section
            >
          </q-item>
        </q-list>
      </q-card>

      <q-card v-if="bracketMatches.length > 0" class="q-mt-md">
        <q-card-section
          ><h6>{{ $t('tournament.bracket') }}</h6></q-card-section
        >
        <q-list>
          <q-item
            v-for="(m, idx) in bracketMatches"
            :key="(m.id as string) || idx"
            class="column items-start q-py-sm"
          >
            <div class="row items-center q-gutter-sm full-width">
              <span
                :class="(m.winner as string) === (m.player1 as string) ? 'text-weight-bold' : ''"
                class="col-4"
                >{{ (m.player1 as string) || 'TBD' }}</span
              >
              <span class="col-1 text-center">vs</span>
              <span
                :class="(m.winner as string) === (m.player2 as string) ? 'text-weight-bold' : ''"
                class="col-4"
                >{{ (m.player2 as string) || 'TBD' }}</span
              >
              <q-badge :color="matchStatusColor((m.status as string) || 'pending')" class="col-2">{{
                (m.status as string) || 'pending'
              }}</q-badge>
            </div>
            <div
              v-if="(m.status as string) === 'pending'"
              class="row q-gutter-xs q-mt-xs items-center"
            >
              <q-input
                :model-value="m.score1"
                type="number"
                label="P1 Score"
                dense
                outlined
                style="width: 80px"
                min="0"
                @update:model-value="m.score1 = Number($event)"
              />
              <q-input
                :model-value="m.score2"
                type="number"
                label="P2 Score"
                dense
                outlined
                style="width: 80px"
                min="0"
                @update:model-value="m.score2 = Number($event)"
              />
              <q-btn dense size="sm" color="primary" label="Submit" @click="reportMatch(m)" />
              <q-btn
                dense
                size="sm"
                color="negative"
                label="W.O."
                @click="walkover(m.id, m.player1 || m.player2 || '')"
              />
            </div>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';

const route = useRoute();
const store = useEventStore();
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const tournamentId = route.params.id as string;
type Participant = Record<string, string>;

const busy = ref(false);
const checkInUserId = ref('');
const participants = ref<Array<Record<string, unknown>>>([]);
interface BracketRow {
  id: string;
  player1?: string;
  player2?: string;
  winner?: string;
  status?: string;
  score1?: number;
  score2?: number;
  round_id?: string;
}
const bracketMatches = ref<BracketRow[]>([]);

const tournament = computed(() => store.current as Record<string, string> | null);
usePageMeta({ title: `Manage: ${tournament.value?.name || ''}` });

function badgeColor(s: string | undefined) {
  return s === 'in_progress' ? 'warning' : s === 'completed' ? 'positive' : 'primary';
}
function matchStatusColor(s: string) {
  return s === 'completed' ? 'positive' : s === 'walkover' ? 'negative' : 'grey';
}

async function publish() {
  busy.value = true;
  try {
    await fetch(`${apiUrl}/api/tournaments/${tournamentId}/publish`, { method: 'POST' });
    await store.get(tournamentId);
  } finally {
    busy.value = false;
  }
}
async function startTournament() {
  busy.value = true;
  try {
    await fetch(`${apiUrl}/api/tournaments/${tournamentId}/start`, { method: 'POST' });
    await store.get(tournamentId);
    await loadBracket();
  } finally {
    busy.value = false;
  }
}
async function checkIn() {
  if (!checkInUserId.value) return;
  await fetch(`${apiUrl}/api/tournaments/${tournamentId}/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: checkInUserId.value }),
  });
  checkInUserId.value = '';
  await loadParticipants();
}
async function reportMatch(m: BracketRow) {
  const winnerId = (m.score1 ?? 0) > (m.score2 ?? 0) ? m.player1 : m.player2;
  if (!winnerId) return;
  await fetch(`${apiUrl}/api/bracket-matches/${m.id}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      winner_id: winnerId,
      score_player1: Number(m.score1 || 0),
      score_player2: Number(m.score2 || 0),
    }),
  });
  await loadBracket();
}
async function walkover(matchId: string, winnerId: string | null) {
  if (!winnerId) return;
  await fetch(`${apiUrl}/api/bracket-matches/${matchId}/walkover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winner_id: winnerId }),
  });
  await loadBracket();
}

async function loadParticipants() {
  try {
    const r = await fetch(`${apiUrl}/api/events/${tournamentId}/participants`);
    const j = await r.json();
    participants.value = j.data ?? [];
  } catch {
    console.warn('failed to load participants');
  }
}
async function loadBracket() {
  try {
    const r = await fetch(`${apiUrl}/api/tournaments/${tournamentId}/bracket`);
    const j = await r.json();
    bracketMatches.value = (j.data?.matches ?? []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      player1: m.player1_id as string | undefined,
      player2: m.player2_id as string | undefined,
      winner: m.winner_id as string | undefined,
      status: m.status as string | undefined,
      score1: (m.score_player1 as number) ?? 0,
      score2: (m.score_player2 as number) ?? 0,
    }));
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
