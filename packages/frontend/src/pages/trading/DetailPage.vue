<template>
  <q-page class="q-pa-md row justify-center">
    <div v-if="session" style="width: 600px">
      <q-card>
        <q-card-section>
          <h5 class="q-my-none">{{ session.name || $t('event.tradingDetails') }}</h5>
          <q-badge :color="statusColor(session.status)" class="q-mt-sm">{{
            session.status
          }}</q-badge>
        </q-card-section>
        <q-card-section>
          <p v-if="session.details">{{ session.details }}</p>
          <div class="text-caption text-grey">{{ formatDate(session.scheduled_at) }}</div>
        </q-card-section>
        <q-card-actions class="q-pa-md q-gutter-sm">
          <q-btn
            v-if="session.status === 'planned' || session.status === 'active'"
            color="primary"
            :label="$t('event.rsvp')"
            :loading="rsvping"
            :disable="!!myParticipation"
            @click="rsvp"
          />
          <q-btn
            v-if="myParticipation?.status === 'pending'"
            color="positive"
            :label="$t('event.confirm')"
            :loading="confirming"
            @click="confirmAttendance"
          />
          <q-btn
            v-if="myParticipation?.status === 'pending'"
            color="negative"
            flat
            :label="$t('event.decline')"
            :loading="declining"
            @click="declineAttendance"
          />
          <q-badge v-if="myParticipation?.status === 'confirmed'" color="positive">{{
            $t('event.confirmed')
          }}</q-badge>
        </q-card-actions>
      </q-card>
      <q-card class="q-mt-md">
        <q-card-section
          ><h6>{{ $t('event.participants') }}</h6></q-card-section
        >
        <q-list>
          <q-item v-for="p in participants" :key="p.id as string">
            <q-item-section>{{ (p as Participant).user_id?.slice(0, 8) }}</q-item-section>
            <q-item-section side>
              <q-badge :color="badgeColor((p as Participant).status)">{{
                (p as Participant).status
              }}</q-badge>
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
import { getClient } from '@/composables/useApi';
import { formatDate } from '@/lib/format';
import { badgeColor, statusColor } from '@/lib/colors';

const route = useRoute();
type Participant = Record<string, string>;

const store = useEventStore();
const authStore = useAuthStore();
const participants = ref<Array<Record<string, unknown>>>([]);
const rsvping = ref(false);
const confirming = ref(false);
const declining = ref(false);
const sessionId = route.params.id as string;

const session = computed(() => store.current as Record<string, string> | null);
const loading = computed(() => store.loading);

const myParticipation = computed(() => {
  if (!authStore.user) return null;
  return (
    (participants.value.find(
      (p) => (p as Participant).user_id === authStore.user?.id,
    ) as Participant | null) ?? null
  );
});

async function rsvp() {
  rsvping.value = true;
  try {
    await store.join(sessionId);
    await loadData();
  } finally {
    rsvping.value = false;
  }
}

async function confirmAttendance() {
  confirming.value = true;
  try {
    await store.confirm(sessionId);
    await loadData();
  } finally {
    confirming.value = false;
  }
}

async function declineAttendance() {
  declining.value = true;
  try {
    await store.decline(sessionId);
    await loadData();
  } finally {
    declining.value = false;
  }
}

async function loadData() {
  await store.get(sessionId);
  try {
    const r = await getClient().api.events[':id'].participants.$get({ param: { id: sessionId } });
    const j = await r.json();
    participants.value = j.data ?? [];
  } catch {
    /* ignore */
  }
}

onMounted(loadData);
</script>
