<template>
  <AppDetailLayout :item="session" :loading="loading">
    <EventHeaderCard
      :title="session!.name || $t('event.tradingDetails')"
      :status="session!.status"
      :participation="myParticipation"
      :confirming="confirming"
      :declining="declining"
      @confirm="confirmAttendance"
      @decline="declineAttendance"
    >
      <p v-if="session!.details">{{ session!.details }}</p>
      <div class="text-caption text-grey">{{ formatDate(session!.scheduled_at) }}</div>
      <template #actions>
        <q-btn
          v-if="session!.status === 'planned' || session!.status === 'active'"
          color="primary"
          :label="$t('event.rsvp')"
          :loading="rsvping"
          :disable="!!myParticipation"
          @click="rsvp"
        />
      </template>
    </EventHeaderCard>
    <ParticipantListCard :title="$t('event.participants')" :participants="participants" />
  </AppDetailLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import EventHeaderCard, {
  type Participation,
} from '@/components/molecules/cards/EventHeaderCard.vue';
import ParticipantListCard, {
  type Participant,
} from '@/components/molecules/cards/ParticipantListCard.vue';
import { apiGet } from '@/composables/useApi';
import { useFormatDate } from '@/composables/useFormatDate';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEventStore } from '@/stores/useEventStore';

const route = useRoute();
const { formatDate } = useFormatDate();

const store = useEventStore();
const authStore = useAuthStore();
const participants = ref<Participant[]>([]);
const rsvping = ref(false);
const confirming = ref(false);
const declining = ref(false);
const sessionId = route.params.id as string;

const session = computed(() => store.current);
const loading = computed(() => store.loading);

const myParticipation = computed<Participation | null>(() => {
  if (!authStore.user) return null;
  return (
    (participants.value.find((p) => p.user_id === authStore.user?.id) as Participation | null) ??
    null
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
    const j = await apiGet(`/api/events/${sessionId}/participants`);
    participants.value = (j.data ?? []) as Participant[];
  } catch {
    /* ignore */
  }
}

onMounted(loadData);
</script>
