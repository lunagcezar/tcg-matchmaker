<template>
  <AppDetailLayout :item="match" :loading="loading" width="600px">
    <q-card>
      <q-card-section>
        <h5 class="q-my-none">{{ $t('event.matchDetails') }}</h5>
        <q-badge :color="statusColor(match!.status)" class="q-mt-sm">{{ match!.status }}</q-badge>
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <strong>{{ $t('event.date') }}:</strong>
            {{ formatDate((match as unknown as MatchDetails).scheduled_at) }}
          </div>
          <div class="col-6">
            <strong>{{ $t('event.players') }}:</strong>
            {{ (match as unknown as MatchDetails).max_participants || 2 }}
          </div>
        </div>
      </q-card-section>
      <q-card-actions class="q-pa-md q-gutter-sm">
        <q-btn
          v-if="!myParticipation && match!.status === 'open'"
          color="primary"
          :label="$t('event.join')"
          :loading="joining"
          @click="join"
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
          <q-item-section>{{
            (p as Participant).username || (p as Participant).user_id?.slice(0, 8)
          }}</q-item-section>
          <q-item-section side>
            <q-badge :color="badgeColor((p as Participant).status)">{{
              (p as Participant).status
            }}</q-badge>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </AppDetailLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { apiGet } from '@/composables/useApi';
import { useFormatDate } from '@/composables/useFormatDate';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';
import { badgeColor, statusColor } from '@/lib/colors';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEventStore } from '@/stores/useEventStore';

const route = useRoute();
const { formatDate } = useFormatDate();
const store = useEventStore();
const authStore = useAuthStore();
const participants = ref<Array<Record<string, unknown>>>([]);
const joining = ref(false);
const confirming = ref(false);
const declining = ref(false);
const matchId = route.params.id as string;

type MatchDetails = Record<string, string | undefined>;
type Participant = Record<string, string>;

const match = computed(() => store.current);
const loading = computed(() => store.loading);

const myParticipation = computed(() => {
  if (!authStore.user) return null;
  return (
    (participants.value.find(
      (p) => (p as Participant).user_id === authStore.user?.id,
    ) as Participant | null) ?? null
  );
});

async function join() {
  joining.value = true;
  try {
    await store.join(matchId);
    await loadData();
  } finally {
    joining.value = false;
  }
}

async function confirmAttendance() {
  confirming.value = true;
  try {
    await store.confirm(matchId);
    await loadData();
  } finally {
    confirming.value = false;
  }
}

async function declineAttendance() {
  declining.value = true;
  try {
    await store.decline(matchId);
    await loadData();
  } finally {
    declining.value = false;
  }
}

async function loadData() {
  await store.get(matchId);
  try {
    const j = await apiGet(`/api/events/${matchId}/participants`);
    participants.value = (j.data ?? []) as Record<string, unknown>[];
  } catch {
    /* ignore */
  }
}

onMounted(loadData);
</script>
