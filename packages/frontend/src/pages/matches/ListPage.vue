<template>
  <MapListLayout
    ref="layoutRef"
    :items="matches"
    :loading="loading"
    :empty-text="$t('home.noEvents')"
  >
    <template #map>
      <EventMap :events="matches" />
    </template>
    <template #filters>
      <q-btn color="primary" icon="add" :label="$t('nav.newMatch')" to="/matches/new" />
      <q-space />
      <FilterToggle v-model="statusFilter" :options="statusOptions" />
    </template>
    <template #items>
      <router-link
        v-for="m in matches"
        :key="m.id as string"
        :to="`/matches/${m.id}`"
        class="event-row"
      >
        <q-badge color="primary" class="q-mr-sm">{{ m.status }}</q-badge>
        <div class="text-body2">
          {{ (m as unknown as MatchListItem).tcg_name || $t('event.anyTcg') }}
        </div>
        <q-space />
        <div class="text-caption text-grey">
          {{ formatDate((m as unknown as MatchListItem).scheduled_at) }}
        </div>
      </router-link>
    </template>
  </MapListLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { formatDate } from '@/lib/format';
import MapListLayout from '@/layouts/MapListLayout.vue';
import FilterToggle from '@/components/molecules/FilterToggle.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';

usePageMeta({ titleKey: 'meta.matches', descKey: 'meta.matchesDesc' });

type MatchListItem = Record<string, string | undefined>;

const store = useEventStore();
const statusFilter = ref<string>('');
const { t } = useI18n();
const layoutRef = ref<InstanceType<typeof MapListLayout> | null>(null);

const statusOptions = [
  { label: t('event.all'), value: '' },
  { label: t('event.open'), value: 'open' },
  { label: t('event.confirmed'), value: 'confirmed' },
  { label: t('event.completed'), value: 'completed' },
];

const matches = computed(() => {
  const all = store.items;
  if (!statusFilter.value) return all;
  return all.filter((m) => m.status === statusFilter.value);
});
const loading = computed(() => store.loading);

onMounted(() => store.list({ type: 'match' }));
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
