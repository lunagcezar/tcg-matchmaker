<template>
  <q-page class="q-pa-md row justify-center">
    <div v-if="match" style="width: 600px">
      <q-card>
        <q-card-section>
          <h5 class="q-my-none">{{ $t('event.matchDetails') }}</h5>
          <q-badge :color="statusColor(match.status)" class="q-mt-sm">{{ match.status }}</q-badge>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div class="col-6"><strong>{{ $t('event.date') }}:</strong> {{ formatDate((match as Record<string, string | undefined>).scheduled_at) }}</div>
            <div class="col-6"><strong>{{ $t('event.players') }}:</strong> {{ (match as Record<string, string | undefined>).max_participants || 2 }}</div>
          </div>
        </q-card-section>
        <q-card-actions class="q-pa-md q-gutter-sm">
          <q-btn v-if="!myParticipation && match.status === 'open'" color="primary" :label="$t('event.join')" @click="join" :loading="joining" />
          <q-btn v-if="myParticipation?.status === 'pending'" color="positive" :label="$t('event.confirm')" @click="confirmAttendance" :loading="confirming" />
          <q-btn v-if="myParticipation?.status === 'pending'" color="negative" flat :label="$t('event.decline')" @click="declineAttendance" :loading="declining" />
          <q-badge v-if="myParticipation?.status === 'confirmed'" color="positive">{{ $t('event.confirmed') }}</q-badge>
        </q-card-actions>
      </q-card>
      <q-card class="q-mt-md">
        <q-card-section><h6>{{ $t('event.participants') }}</h6></q-card-section>
        <q-list>
          <q-item v-for="p in participants" :key="(p.id as string)">
            <q-item-section>{{ (p as Record<string, string>).user_id?.slice(0, 8) }}</q-item-section>
            <q-item-section side>
              <q-badge :color="badgeColor((p as Record<string, string>).status)">{{ (p as Record<string, string>).status }}</q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
    <div v-else-if="loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';
import { useAuthStore } from '@/stores/useAuthStore';

const route = useRoute();
const store = useEventStore();
const authStore = useAuthStore();
const participants = ref<Array<Record<string, unknown>>>([]);
const joining = ref(false);
const confirming = ref(false);
const declining = ref(false);
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const matchId = route.params.id as string;

const match = computed(() => store.current as Record<string, string> | null);
const loading = computed(() => store.loading);

const myParticipation = computed(() => {
  if (!authStore.user) return null;
  return participants.value.find((p) => (p as Record<string, string>).user_id === authStore.user?.id) as Record<string, string> | null ?? null;
});

function formatDate(d: string | undefined) { return d ? new Date(d).toLocaleString() : ''; }
function badgeColor(s: string | undefined) { return s === 'confirmed' ? 'positive' : s === 'declined' ? 'negative' : 'warning'; }
function statusColor(s: string | undefined) { return s === 'open' ? 'primary' : s === 'confirmed' ? 'positive' : s === 'cancelled' ? 'negative' : 'grey'; }

async function join() {
  joining.value = true;
  try { await store.join(matchId); await loadData(); } finally { joining.value = false; }
}

async function confirmAttendance() {
  confirming.value = true;
  try { await store.confirm(matchId); await loadData(); } finally { confirming.value = false; }
}

async function declineAttendance() {
  declining.value = true;
  try { await store.decline(matchId); await loadData(); } finally { declining.value = false; }
}

async function loadData() {
  await store.get(matchId);
  try { const r = await fetch(`${apiUrl}/api/events/${matchId}/participants`); const j = await r.json(); participants.value = j.data ?? []; } catch { /* ignore */ }
}

onMounted(loadData);
</script>
