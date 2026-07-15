<template>
  <q-page class="q-pa-md row justify-center">
    <div v-if="tournament" style="width: 800px">
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <h5 class="q-my-none">{{ tournament.name || $t('tournament.details') }}</h5>
            <q-badge :color="badgeColor(tournament.status)" class="q-ml-sm">{{ tournament.status }}</q-badge>
          </div>
          <div class="text-caption text-grey q-mt-sm">{{ $t('event.date') }}: {{ formatDate(tournament.scheduled_at) }}</div>
        </q-card-section>
        <q-card-actions v-if="tournament.status === 'open'" class="q-pa-md">
          <q-btn color="warning" :label="$t('tournament.register')" @click="register" :loading="registering" />
        </q-card-actions>
      </q-card>
      <q-card v-if="tournament.status === 'in_progress' || tournament.status === 'completed'" class="q-mt-md">
        <q-card-section><h6>{{ $t('tournament.bracket') }}</h6></q-card-section>
        <div ref="bracketRef" class="bracket-container"></div>
      </q-card>
      <q-card class="q-mt-md">
        <q-card-section><h6>{{ $t('tournament.participants') }}</h6></q-card-section>
        <q-card-section v-if="participants.length === 0" class="text-grey">{{ $t('tournament.noParticipants') }}</q-card-section>
        <q-list v-else>
          <q-item v-for="p in participants" :key="(p.id as string)">
            <q-item-section>{{ (p as Record<string, string>).user_id?.slice(0, 8) }}</q-item-section>
            <q-item-section side><q-badge>{{ (p as Record<string, string>).status }}</q-badge></q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
    <div v-else-if="loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { useBracketD3 } from '@/composables/useBracketD3';

const route = useRoute();
const store = useEventStore();
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const tournamentId = route.params.id as string;
const participants = ref<Array<Record<string, unknown>>>([]);
const registering = ref(false);
const bracketRef = ref<HTMLElement | null>(null);

const tournament = computed(() => store.current as Record<string, string> | null);
const loading = computed(() => store.loading);

usePageMeta({ title: tournament.value?.name || 'Tournament' });

function badgeColor(s: string | undefined) { return s === 'in_progress' ? 'warning' : s === 'completed' ? 'positive' : 'primary'; }
function formatDate(d: string | undefined) { return d ? new Date(d).toLocaleString() : ''; }

async function register() { registering.value = true; try { await store.join(tournamentId); await store.get(tournamentId); } finally { registering.value = false; } }

async function loadBracket() {
  try {
    const r = await fetch(`${apiUrl}/api/tournaments/${tournamentId}/bracket`);
    const j = await r.json();
    if (j.data?.matches) {
      watch(bracketRef, () => {
        if (bracketRef.value) useBracketD3(bracketRef, ref([]));
      });
    }
  } catch { console.warn('bracket load failed'); }
}

onMounted(async () => {
  await store.get(tournamentId);
  try { const r = await fetch(`${apiUrl}/api/events/${tournamentId}/participants`); const j = await r.json(); participants.value = j.data ?? []; } catch { console.warn('failed to load participants'); }
  if (tournament.value?.status === 'in_progress' || tournament.value?.status === 'completed') {
    await loadBracket();
  }
});
</script>

<style scoped>
.bracket-container { min-height: 300px; overflow-x: auto; }
</style>
