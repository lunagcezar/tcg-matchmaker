<template>
  <AppListLayout :title="$t('nav.trading')" :loading="loading" :empty="sessions.length === 0">
    <template #actions>
      <q-btn color="positive" icon="add" :label="$t('nav.newTrading')" to="/trading/new" />
    </template>
    <q-card
      v-for="s in sessions"
      :key="s.id as string"
      clickable
      :to="`/trading/${s.id}`"
      class="q-mb-sm"
    >
      <q-card-section class="q-py-sm row items-center">
        <q-badge color="positive" class="q-mr-sm">{{ s.status }}</q-badge>
        <div class="text-body2">{{ (s as unknown as TradingSession).name || 'Trading' }}</div>
        <q-space />
        <div class="text-caption text-grey">
          {{ formatDate((s as unknown as TradingSession).scheduled_at) }}
        </div>
      </q-card-section>
    </q-card>
  </AppListLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { formatDate } from '@/lib/format';
import AppListLayout from '@/layouts/AppListLayout.vue';

usePageMeta({ titleKey: 'meta.trading', descKey: 'meta.tradingDesc' });

type TradingSession = Record<string, string | undefined>;

const store = useEventStore();
const sessions = computed(() => store.items);
const loading = computed(() => store.loading);
onMounted(() => store.list({ type: 'trading' }));
</script>
