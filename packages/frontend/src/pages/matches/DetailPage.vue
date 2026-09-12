<template>
  <AppDetailLayout :item="match" :loading="loading" width="600px">
    <EventHeaderCard
      :title="(match as unknown as MatchDetails).name || $t('event.matchDetails')"
      :status="match!.status"
      :participation="myParticipation"
      :confirming="confirming"
      :declining="declining"
      @confirm="confirmAttendance"
      @decline="declineAttendance"
    >
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
      <template #actions>
        <q-btn
          v-if="!myParticipation && match!.status === 'open'"
          color="primary"
          :label="$t('event.join')"
          :loading="joining"
          @click="join"
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
import ParticipantListCard from '@/components/molecules/cards/ParticipantListCard.vue';
import { useFormatDate } from '@/composables/useFormatDate';
import { useParticipants } from '@/composables/useParticipants';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEventStore } from '@/stores/useEventStore';

const route = useRoute();
const { formatDate } = useFormatDate();
const store = useEventStore();
const authStore = useAuthStore();
const joining = ref(false);
const confirming = ref(false);
const declining = ref(false);
const matchId = route.params.id as string;

type MatchDetails = Record<string, string | undefined>;

const match = computed(() => store.current);
const loading = computed(() => store.loading);
const { participants, loadParticipants } = useParticipants(matchId);

const myParticipation = computed<Participation | null>(() => {
  if (!authStore.user) return null;
  return (
    (participants.value.find((p) => p.user_id === authStore.user?.id) as Participation | null) ??
    null
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
  await loadParticipants();
}

onMounted(loadData);
</script>
