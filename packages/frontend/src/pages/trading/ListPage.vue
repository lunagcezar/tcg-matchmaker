<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-my-none">{{ $t('nav.trading') }}</h5>
      <q-btn color="positive" icon="add" :label="$t('nav.newTrading')" to="/trading/new" />
    </div>
    <div v-if="loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>
    <div v-else>
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
      <div v-if="sessions.length === 0" class="text-center text-grey q-py-xl">
        {{ $t('common.noResults') }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { formatDate } from '@/lib/format';

usePageMeta({ titleKey: 'meta.trading', descKey: 'meta.tradingDesc' });

type TradingSession = Record<string, string | undefined>;

const store = useEventStore();
const sessions = computed(() => store.items);
const loading = computed(() => store.loading);
onMounted(() => store.list({ type: 'trading' }));
</script>
