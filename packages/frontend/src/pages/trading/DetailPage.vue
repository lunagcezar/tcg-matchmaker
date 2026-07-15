<template>
  <q-page class="q-pa-md row justify-center">
    <div v-if="session" style="width: 600px">
      <q-card>
        <q-card-section>
          <h5 class="q-my-none">{{ session.name || $t('event.tradingDetails') }}</h5>
          <q-badge color="positive" class="q-mt-sm">{{ statusText(session.status) }}</q-badge>
        </q-card-section>
        <q-card-section>
          <p v-if="session.details">{{ session.details }}</p>
          <div class="text-caption text-grey">{{ formatDate(session.scheduled_at) }}</div>
        </q-card-section>
        <q-card-actions class="q-pa-md">
          <q-btn v-if="session.status === 'planned' || session.status === 'active'" color="positive" :label="$t('event.rsvp')" @click="rsvp" :loading="rsvping" />
        </q-card-actions>
      </q-card>
      <q-card class="q-mt-md">
        <q-card-section><h6>{{ $t('event.participants') }}</h6></q-card-section>
        <q-list>
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
import { computed, onMounted, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';

const route = useRoute();
const store = useEventStore();
const participants = shallowRef<Array<Record<string, unknown>>>([]);
const rsvping = shallowRef(false);
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const sessionId = route.params.id as string;

const session = computed(() => store.current as Record<string, string> | null);
const loading = computed(() => store.loading);

function formatDate(d: string | undefined) { return d ? new Date(d).toLocaleString() : ''; }
function statusText(s: string | undefined) { return s || 'unknown'; }

async function rsvp() { rsvping.value = true; try { await store.join(sessionId); await store.get(sessionId); } finally { rsvping.value = false; } }

onMounted(async () => {
  await store.get(sessionId);
  try { const r = await fetch(`${apiUrl}/api/events/${sessionId}/participants`); const j = await r.json(); participants.value = j.data ?? []; } catch { /* ignore */ }
});
</script>
