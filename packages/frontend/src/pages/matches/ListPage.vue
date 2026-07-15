<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-my-none">Matches</h5>
      <q-btn color="primary" icon="add" label="New Match" to="/matches/new" />
    </div>
    <q-btn-toggle v-model="statusFilter" :options="statusOptions" outline rounded class="q-mb-md" />
    <div v-if="loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>
    <div v-else>
      <q-card v-for="m in matches" :key="(m.id as string)" clickable :to="`/matches/${m.id}`" class="q-mb-sm">
        <q-card-section class="q-py-sm row items-center">
          <q-badge color="primary" class="q-mr-sm">{{ m.status }}</q-badge>
          <div class="text-body2">{{ ((m as Record<string, string>).tcg_name) || 'Any TCG' }}</div>
          <q-space />
          <div class="text-caption text-grey">{{ formatDate((m as Record<string, string | undefined>).scheduled_at) }}</div>
        </q-card-section>
      </q-card>
      <div v-if="matches.length === 0" class="text-center text-grey q-py-xl">{{ $t('common.noResults') }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';

const store = useEventStore();
const statusFilter = ref<string>('');
const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
];

const matches = computed(() => {
  const all = store.items as Array<Record<string, string>>;
  if (!statusFilter.value) return all;
  return all.filter((m) => m.status === statusFilter.value);
});
const loading = computed(() => store.loading);

function formatDate(d: string | undefined) {
  if (!d) return '';
  return new Date(d).toLocaleDateString();
}

onMounted(() => store.list({ type: 'match' }));
</script>
