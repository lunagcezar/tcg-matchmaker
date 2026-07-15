<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-my-none">{{ $t('nav.trading') }}</h5>
      <q-btn color="positive" icon="add" :label="$t('nav.newTrading')" to="/trading/new" />
    </div>
    <div v-if="loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>
    <div v-else>
      <q-card v-for="s in sessions" :key="(s.id as string)" clickable :to="`/trading/${s.id}`" class="q-mb-sm">
        <q-card-section class="q-py-sm row items-center">
          <q-badge color="positive" class="q-mr-sm">{{ s.status }}</q-badge>
          <div class="text-body2">{{ (s as Record<string, string | undefined>).name || 'Trading' }}</div>
          <q-space />
          <div class="text-caption text-grey">{{ formatDate((s as Record<string, string | undefined>).scheduled_at) }}</div>
        </q-card-section>
      </q-card>
      <div v-if="sessions.length === 0" class="text-center text-grey q-py-xl">{{ $t('common.noResults') }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';

usePageMeta({ title: 'Trading Sessions', description: 'Browse TCG trading sessions near you' });

const store = useEventStore();
const sessions = computed(() => store.items as Array<Record<string, string>>);
const loading = computed(() => store.loading);
function formatDate(d: string | undefined) { return d ? new Date(d).toLocaleDateString() : ''; }
onMounted(() => store.list({ type: 'trading' }));
</script>
