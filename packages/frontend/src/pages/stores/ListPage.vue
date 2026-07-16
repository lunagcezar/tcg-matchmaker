<template>
  <AppListLayout :title="$t('nav.stores')" :loading="loading" :empty="stores.length === 0">
    <template #actions>
      <q-btn color="primary" icon="add" :label="$t('store.create')" to="/stores/new" />
    </template>
    <template #filters>
      <q-input
        v-model="search"
        :label="$t('common.search')"
        outlined
        dense
        class="q-mb-md"
        @update:model-value="filtered"
      />
    </template>
    <div class="row q-col-gutter-md">
      <div v-for="s in stores" :key="s.id as string" class="col-12 col-sm-6 col-md-4">
        <q-card clickable :to="`/stores/${s.id}`">
          <q-card-section>
            <div class="text-h6">{{ s.name }}</div>
            <div class="text-caption text-grey">{{ s.city }}, {{ s.state }}</div>
            <q-badge v-if="s.is_verified" color="positive" class="q-mt-sm">{{
              $t('store.verified')
            }}</q-badge>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </AppListLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStoreStore } from '@/stores/useStoreStore';
import { usePageMeta } from '@/composables/usePageMeta';
import AppListLayout from '@/layouts/AppListLayout.vue';

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

function filtered() {
  /* computed handles it */
}

onMounted(() => storeStore.list());
</script>
