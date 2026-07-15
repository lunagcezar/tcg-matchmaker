<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-my-none">{{ $t('nav.stores') }}</h5>
      <q-btn color="primary" icon="add" :label="$t('store.create')" to="/stores/new" />
    </div>
    <q-input v-model="search" :label="$t('common.search')" outlined dense class="q-mb-md" @update:model-value="filtered" />
    <div v-if="loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>
    <div v-else class="row q-col-gutter-md">
      <div v-for="s in stores" :key="(s.id as string)" class="col-12 col-sm-6 col-md-4">
        <q-card clickable :to="`/stores/${s.id}`">
          <q-card-section>
            <div class="text-h6">{{ s.name }}</div>
            <div class="text-caption text-grey">{{ s.city }}, {{ s.state }}</div>
            <q-badge v-if="s.is_verified" color="positive" class="q-mt-sm">{{ $t('store.verified') }}</q-badge>
          </q-card-section>
        </q-card>
      </div>
      <div v-if="stores.length === 0" class="col-12 text-center text-grey">{{ $t('common.noResults') }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStoreStore } from '@/stores/useStoreStore';
import { usePageMeta } from '@/composables/usePageMeta';

usePageMeta({ titleKey: 'meta.stores', descKey: 'meta.storesDesc' });

const storeStore = useStoreStore();
const search = ref('');

const stores = computed(() => {
  const items = storeStore.items as Array<Record<string, string>>;
  if (!search.value) return items;
  const q = search.value.toLowerCase();
  return items.filter((s) => (s.name?.toLowerCase() || '').includes(q) || (s.city?.toLowerCase() || '').includes(q));
});

const loading = computed(() => storeStore.loading);

function filtered() { /* computed handles it */ }

onMounted(() => storeStore.list());
</script>
