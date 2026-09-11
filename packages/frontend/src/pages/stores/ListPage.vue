<template>
  <MapListLayout :items="stores" :loading="loading" :empty-text="$t('home.noEvents')">
    <template #map>
      <EventMap :events="stores as unknown as Record<string, unknown>[]" />
    </template>
    <template #filters>
      <q-input v-model="search" :label="$t('common.search')" outlined dense class="flex-1" />
      <q-btn color="primary" icon="add" :label="$t('store.create')" to="/stores/new" />
    </template>
    <template #items>
      <BaseList :items="stores" :loading="loading" @load-more="onLoad">
        <template #item="{ item }">
          <div class="col-12 col-sm-6 col-md-4">
            <router-link :to="`/stores/${item.id}`" class="store-card row items-center">
              <div class="row items-center full-width justify-between">
                <div class="row items-center">
                  <span class="text-h6">{{ item.name }}</span>
                  <q-icon
                    v-if="item.is_verified"
                    name="check_circle"
                    color="positive"
                    size="sm"
                    class="q-ml-sm"
                  />
                </div>
                <div class="text-caption text-grey">{{ item.city }}, {{ item.state }}</div>
              </div>
            </router-link>
          </div>
        </template>
      </BaseList>
    </template>
  </MapListLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import BaseList from '@/components/organisms/BaseList.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';
import { usePageMeta } from '@/composables/usePageMeta';
import MapListLayout from '@/layouts/MapListLayout.vue';
import { useStoreStore } from '@/stores/useStoreStore';

usePageMeta({ titleKey: 'meta.stores', descKey: 'meta.storesDesc' });

const storeStore = useStoreStore();
const search = ref('');

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
  padding: 0.75rem 1rem;
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
