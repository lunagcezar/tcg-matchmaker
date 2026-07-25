<template>
  <q-page class="q-py-md">
    <div v-if="store" class="store-detail">
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
      <q-card class="q-mt-md">
        <q-card-section
          ><h6>{{ $t('store.members') }}</h6></q-card-section
        >
        <q-list v-if="members.length > 0">
          <q-item v-for="m in members" :key="m.id as string">
            <q-item-section>{{
              (m as StoreMember).username || (m as StoreMember).user_id
            }}</q-item-section>
            <q-item-section side
              ><q-badge>{{ (m as StoreMember).role }}</q-badge></q-item-section
            >
          </q-item>
        </q-list>
        <q-card-section v-else class="text-grey">{{ $t('store.noMembers') }}</q-card-section>
      </q-card>
    </div>
    <div v-else-if="storeStore.loading" class="text-center q-py-xl">
      <q-spinner size="lg" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStoreStore } from '@/stores/useStoreStore';
import EventMap from '@/components/organisms/home/EventMap.vue';

const route = useRoute();
type StoreMember = Record<string, string>;

const storeStore = useStoreStore();
const members = ref<Array<Record<string, unknown>>>([]);

const store = computed(() => storeStore.current);
const storeId = route.params.id as string;

onMounted(async () => {
  await storeStore.get(storeId);
  try {
    members.value = ((await storeStore.getMembers(storeId)) ?? []) as Record<string, unknown>[];
  } catch {
    /* ignore */
  }
});
</script>

<style scoped>
.store-detail {
  max-width: 600px;
  margin: 0 auto;
}
</style>
