<template>
  <MapListLayout
    ref="layoutRef"
    :items="sessions"
    :loading="loading"
    :empty-text="$t('home.noEvents')"
  >
    <template #map>
      <EventMap :events="store.items" />
    </template>
    <template #filters>
      <q-btn color="positive" icon="add" :label="$t('nav.newTrading')" to="/trading/new" />
    </template>
    <template #items>
      <router-link
        v-for="s in sessions"
        :key="s.id as string"
        :to="`/trading/${s.id}`"
        class="event-row"
      >
        <q-badge color="positive" class="q-mr-sm">{{ s.status }}</q-badge>
        <div class="text-body2">{{ (s as unknown as TradingSession).name || 'Trading' }}</div>
        <q-space />
        <div class="text-caption text-grey">
          {{ formatDate((s as unknown as TradingSession).scheduled_at) }}
        </div>
      </router-link>
    </template>
  </MapListLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { formatDate } from '@/lib/format';
import MapListLayout from '@/layouts/MapListLayout.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';

usePageMeta({ titleKey: 'meta.trading', descKey: 'meta.tradingDesc' });

type TradingSession = Record<string, string | undefined>;

const store = useEventStore();
const layoutRef = ref<InstanceType<typeof MapListLayout> | null>(null);
const sessions = computed(() => store.items);
const loading = computed(() => store.loading);
onMounted(() => store.list({ type: 'trading' }));
</script>

<style scoped>
.event-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border);
  color: var(--foreground);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease;
}

.event-row:hover {
  background-color: var(--muted);
}

.event-row:first-child {
  border-top: 1px solid var(--border);
}
</style>
