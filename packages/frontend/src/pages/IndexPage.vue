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
      <div class="filter-segment">
        <button
          v-for="opt in typeOptions"
          :key="opt.value"
          class="filter-segment__btn"
          :class="{ active: selectedTypes[0] === opt.value }"
          @click="onFilterChange([opt.value])"
        >
          {{ opt.label }}
        </button>
      </div>
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
import { useI18n } from 'vue-i18n';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { eventColor, statusColor } from '@/lib/colors';
import { eventRoute } from '@/lib/router';
import { relativeTime } from '@/lib/format';
import MapListLayout from '@/layouts/MapListLayout.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';

usePageMeta({ titleKey: 'meta.home', descKey: 'meta.homeDesc' });

const { t } = useI18n();
const eventStore = useEventStore();
const selectedTypes = ref<string[]>(['']);
const layoutRef = ref<InstanceType<typeof MapListLayout> | null>(null);

const scrollTarget = computed(() => layoutRef.value?.scrollRef ?? undefined);

const typeOptions = computed(() => [
  { label: t('event.all'), value: '' },
  { label: t('nav.matches'), value: 'match' },
  { label: t('nav.trading'), value: 'trading' },
  { label: t('nav.tournaments'), value: 'tournament' },
]);

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

.filter-segment {
  display: inline-flex;
  flex-wrap: wrap;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.filter-segment__btn {
  all: unset;
  cursor: pointer;
  padding: 0.35rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-right: 1px solid var(--border);
  color: var(--muted-foreground);
  transition:
    color 0.15s,
    font-weight 0.15s;
}

.filter-segment__btn:last-child {
  border-right: none;
}

.filter-segment__btn.active {
  color: var(--primary);
  font-weight: 700;
}

@media (max-width: 480px) {
  .filter-segment {
    width: 100%;
  }
}
</style>
