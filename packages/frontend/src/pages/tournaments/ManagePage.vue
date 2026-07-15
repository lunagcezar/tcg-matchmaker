<template>
  <q-page class="q-pa-md row justify-center">
    <div v-if="tournament" style="width: 700px">
      <q-card>
        <q-card-section>
          <h5 class="q-my-none">{{ $t('tournament.manage') }}: {{ tournament.name }}</h5>
          <q-badge :color="badgeColor(tournament.status)" class="q-mt-sm">{{ tournament.status }}</q-badge>
        </q-card-section>
        <q-card-actions class="q-pa-md q-gutter-sm">
          <q-btn v-if="tournament.status === 'draft'" color="primary" :label="$t('tournament.publish')" @click="publish" :loading="busy" />
          <q-btn v-if="tournament.status === 'open'" color="warning" :label="$t('tournament.start')" @click="startTournament" :loading="busy" />
        </q-card-actions>
      </q-card>
      <q-card class="q-mt-md">
        <q-card-section>
          <h6>{{ $t('tournament.participants') }}</h6>
          <div class="row q-col-gutter-sm q-mt-sm">
            <q-input v-model="checkInUserId" label="User ID to check in" outlined dense class="col" />
            <q-btn color="positive" :label="$t('tournament.checkIn')" @click="checkIn" class="col-auto" />
          </div>
        </q-card-section>
        <q-list>
          <q-item v-for="p in participants" :key="(p.id as string)">
            <q-item-section>{{ (p as Record<string, string>).user_id?.slice(0, 8) }}</q-item-section>
            <q-item-section side><q-badge>{{ (p as Record<string, string>).status }}</q-badge></q-item-section>
          </q-item>
        </q-list>
      </q-card>
      <q-card class="q-mt-md" v-if="tournament.status === 'in_progress'">
        <q-card-section><h6>{{ $t('tournament.bracket') }}</h6></q-card-section>
        <div ref="bracketRef" class="bracket-container"></div>
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
const busy = ref(false);
const checkInUserId = ref('');
const participants = ref<Array<Record<string, unknown>>>([]);

const tournament = computed(() => store.current as Record<string, string> | null);
usePageMeta({ title: `Manage: ${tournament.value?.name || ''}` });

function badgeColor(s: string | undefined) { return s === 'in_progress' ? 'warning' : s === 'completed' ? 'positive' : 'primary'; }

async function publish() { busy.value = true; try { await fetch(`${apiUrl}/api/tournaments/${tournamentId}/publish`, { method: 'POST' }); await store.get(tournamentId); } finally { busy.value = false; } }
async function startTournament() { busy.value = true; try { await fetch(`${apiUrl}/api/tournaments/${tournamentId}/start`, { method: 'POST' }); await store.get(tournamentId); } finally { busy.value = false; } }
async function checkIn() { if (!checkInUserId.value) return; await fetch(`${apiUrl}/api/tournaments/${tournamentId}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: checkInUserId.value }) }); checkInUserId.value = ''; await loadParticipants(); }

async function loadParticipants() {
  try { const r = await fetch(`${apiUrl}/api/events/${tournamentId}/participants`); const j = await r.json(); participants.value = j.data ?? []; } catch { console.warn('failed to load participants'); }
}

onMounted(async () => {
  await store.get(tournamentId);
  await loadParticipants();
});
</script>

<style scoped>
.bracket-container { min-height: 300px; overflow-x: auto; }
</style>
