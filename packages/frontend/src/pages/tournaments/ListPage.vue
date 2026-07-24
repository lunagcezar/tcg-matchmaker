<template>
  <MapListLayout
    ref="layoutRef"
    :items="tournaments"
    :loading="loading"
    :empty-text="$t('home.noEvents')"
  >
    <template #map>
      <EventMap :events="tournaments" />
    </template>
    <template #filters>
      <q-btn
        color="warning"
        icon="add"
        :label="$t('tournament.createLabel')"
        to="/tournaments/new"
      />
    </template>
    <template #items>
      <router-link
        v-for="t in tournaments"
        :key="t.id as string"
        :to="`/tournaments/${t.id}`"
        class="event-row"
      >
        <q-badge :color="badgeColor(t.status)" class="q-mr-sm">{{ t.status }}</q-badge>
        <div class="text-body2">{{ t.name || $t('nav.tournaments') }}</div>
        <q-space />
        <div class="text-caption text-grey">{{ formatDate(t.scheduled_at) }}</div>
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

usePageMeta({ titleKey: 'nav.tournaments', descKey: 'meta.homeDesc' });

const store = useEventStore();
const layoutRef = ref<InstanceType<typeof MapListLayout> | null>(null);
const tournaments = computed(() => store.items);
const loading = computed(() => store.loading);

function badgeColor(s: string | undefined) {
  return s === 'in_progress' ? 'warning' : s === 'completed' ? 'positive' : 'primary';
}
onMounted(() => store.list({ type: 'tournament' }));
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
