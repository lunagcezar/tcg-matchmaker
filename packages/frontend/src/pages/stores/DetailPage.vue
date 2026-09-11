<template>
  <q-page>
    <div v-if="store">
      <div class="map-container" style="height: 200px">
        <EventMap :events="[store as unknown as Record<string, unknown>]" />
      </div>
      <q-card class="q-mt-md">
        <q-card-section>
          <div class="row items-center">
            <h5 class="q-my-none">{{ store!.name }}</h5>
            <q-icon
              v-if="store!.is_verified"
              name="check_circle"
              color="positive"
              size="sm"
              class="q-ml-sm"
            />
          </div>
          <div class="text-caption text-grey q-mt-sm">
            {{ store!.address }}, {{ store!.city }}, {{ store!.state }}
          </div>
        </q-card-section>
      </q-card>
      <ParticipantListCard
        :title="$t('store.members')"
        :participants="members"
        badge-key="role"
        :empty-text="$t('store.noMembers')"
      />
    </div>
    <div v-else-if="storeStore.loading" class="text-center q-py-xl">
      <q-spinner size="lg" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

import ParticipantListCard, {
  type Participant,
} from '@/components/molecules/cards/ParticipantListCard.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';
import { useStoreStore } from '@/stores/useStoreStore';

const route = useRoute();

const storeStore = useStoreStore();
const members = ref<Participant[]>([]);

const store = computed(() => storeStore.current);
const storeId = route.params.id as string;

onMounted(async () => {
  await storeStore.get(storeId);
  try {
    members.value = ((await storeStore.getMembers(storeId)) ?? []) as Participant[];
  } catch {
    /* ignore */
  }
});
</script>
