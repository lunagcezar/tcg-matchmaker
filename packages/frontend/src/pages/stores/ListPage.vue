<template>
  <MapListLayout
    ref="layoutRef"
    :items="stores"
    :loading="loading"
    :empty-text="$t('home.noEvents')"
  >
    <template #map>
      <EventMap :events="stores as unknown as Record<string, unknown>[]" />
    </template>
    <template #filters>
      <q-input v-model="search" :label="$t('common.search')" outlined dense class="flex-1" />
      <q-btn color="primary" icon="add" :label="$t('store.create')" to="/stores/new" />
    </template>
    <template #items>
      <q-infinite-scroll :offset="250" :scroll-target="scrollTarget" @load="onLoad">
        <div class="row q-col-gutter-md">
          <div v-for="s in stores" :key="s.id as string" class="col-12 col-sm-6 col-md-4">
            <router-link :to="`/stores/${s.id}`" class="store-card">
              <div class="text-h6">{{ s.name }}</div>
              <div class="text-caption text-grey">{{ s.city }}, {{ s.state }}</div>
              <q-badge v-if="s.is_verified" color="positive" class="q-mt-sm">{{
                $t('store.verified')
              }}</q-badge>
            </router-link>
          </div>
        </div>
        <template #loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </template>
  </MapListLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStoreStore } from '@/stores/useStoreStore';
import { usePageMeta } from '@/composables/usePageMeta';
import MapListLayout from '@/layouts/MapListLayout.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';

usePageMeta({ titleKey: 'meta.stores', descKey: 'meta.storesDesc' });

const storeStore = useStoreStore();
const search = ref('');
const layoutRef = ref<InstanceType<typeof MapListLayout> | null>(null);
const scrollTarget = computed(() => layoutRef.value?.scrollRef ?? undefined);

const stores = computed(() => {
  const items = storeStore.items;
  if (!search.value) return items;
  const q = search.value.toLowerCase();
  return items.filter(
    (s) => (s.name?.toLowerCase() || '').includes(q) || (s.city?.toLowerCase() || '').includes(q),
  );
});

const loading = computed(() => storeStore.loading);

async function onLoad(_index: number, done: (stop?: boolean) => void) {
  await storeStore.loadMore();
  done(!storeStore.hasMore);
}

onMounted(() => storeStore.list());
</script>

<style scoped>
.store-card {
  display: block;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--foreground);
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.store-card:hover {
  background-color: var(--muted);
  border-color: var(--primary);
}

.flex-1 {
  flex: 1;
}
</style>
