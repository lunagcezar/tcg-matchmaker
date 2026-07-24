<template>
  <MapListLayout
    ref="layoutRef"
    :items="filteredEvents"
    :loading="eventStore.loading"
    :empty-text="$t('home.noEvents')"
  >
    <template #map>
      <EventMap :events="filteredEvents" />
    </template>
    <template #filters>
      <q-btn flat dense icon="my_location" :label="$t('home.findNearMe')" @click="geolocate" />
      <q-space />
      <FilterToggle
        :model-value="selectedTypes"
        :options="typeOptions"
        @update:model-value="onFilterChange"
      />
    </template>
    <template #items>
      <q-infinite-scroll :offset="250" :scroll-target="scrollTarget" @load="loadMore">
        <router-link
          v-for="event in filteredEvents"
          :key="event.id as string"
          :to="eventRoute(event)"
          class="event-row"
        >
          <q-badge :color="eventColor(event.type as string)" class="q-mr-sm">
            {{ event.type }}
          </q-badge>
          <q-badge :color="statusColor(event.status as string)" outline class="q-mr-sm">
            {{ event.status }}
          </q-badge>
          <div class="event-row__name">{{ event.name || event.type }}</div>
          <q-space />
          <div class="event-row__time">{{ relativeTime(event.scheduled_at as string) }}</div>
        </router-link>
        <template #loading>
          <div class="row justify-center q-my-md">
            <q-spinner color="primary" size="2rem" />
          </div>
        </template>
      </q-infinite-scroll>
    </template>
  </MapListLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { eventColor, statusColor } from '@/lib/colors';
import { eventRoute } from '@/lib/router';
import { relativeTime } from '@/lib/format';
import MapListLayout from '@/layouts/MapListLayout.vue';
import FilterToggle from '@/components/molecules/FilterToggle.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';

usePageMeta({ titleKey: 'meta.home', descKey: 'meta.homeDesc' });

const eventStore = useEventStore();
const selectedTypes = ref<string[]>(['']);
const layoutRef = ref<InstanceType<typeof MapListLayout> | null>(null);

const scrollTarget = computed(() => layoutRef.value?.scrollRef ?? undefined);

const typeOptions = [
  { label: 'All', value: '' },
  { label: 'Matches', value: 'match' },
  { label: 'Trading', value: 'trading' },
  { label: 'Tournaments', value: 'tournament' },
];

function filterParams(): Record<string, string> | undefined {
  const t = selectedTypes.value;
  if (t.length === 1 && t[0]) {
    return { type: t[0] };
  }
  return undefined;
}

const filteredEvents = computed(() => {
  const events = eventStore.items;
  const t = selectedTypes.value;
  if (t.length === 0 || t.includes('')) return events;
  return events.filter((e) => t.includes(e.type));
});

function onFilterChange(value: string | string[]) {
  const types = Array.isArray(value) ? value : [value];
  const added = types.find((x) => !selectedTypes.value.includes(x));
  if (added === '') {
    selectedTypes.value = [''];
  } else if (added) {
    selectedTypes.value = [added];
  } else if (types.length === 0) {
    selectedTypes.value = [''];
  } else {
    selectedTypes.value = types;
  }
  eventStore.reset();
  void eventStore.list(filterParams());
}

function geolocate() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {},
    );
  }
}

function loadMore(_index: number, done: (stop?: boolean) => void) {
  void eventStore.loadMore(filterParams()).then(() => done(!eventStore.hasMore));
}

onMounted(() => {
  void eventStore.list();
});
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

.event-row__name {
  font-weight: 600;
  font-size: 0.875rem;
}

.event-row__time {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
</style>
