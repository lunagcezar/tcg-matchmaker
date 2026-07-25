<template>
  <MapListLayout
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
      <StatusFilterSegment v-model="selectedType" :options="typeOptions" />
    </template>
    <template #items>
      <BaseList :items="filteredEvents" :loading="eventStore.loading" @load-more="loadMore">
        <template #item="{ item }">
          <EventRow :to="eventRoute(item)">
            <q-badge :color="eventColor(item.type)" class="q-mr-sm">{{ item.type }}</q-badge>
            <StatusBadge :status="item.status" class="q-mr-sm" />
            <div class="event-row__name">{{ item.name || item.type }}</div>
            <q-space />
            <div class="event-row__time">{{ formatRelative(item.scheduled_at) }}</div>
          </EventRow>
        </template>
      </BaseList>
    </template>
  </MapListLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { useFormatDate } from '@/composables/useFormatDate';
import { eventColor } from '@/lib/colors';
import { eventRoute } from '@/lib/router';
import MapListLayout from '@/layouts/MapListLayout.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';
import BaseList from '@/components/organisms/BaseList.vue';
import EventRow from '@/components/molecules/EventRow.vue';
import StatusFilterSegment from '@/components/molecules/StatusFilterSegment.vue';
import StatusBadge from '@/components/atoms/StatusBadge.vue';

usePageMeta({ titleKey: 'meta.home', descKey: 'meta.homeDesc' });

const { t } = useI18n();
const { formatRelative } = useFormatDate();
const eventStore = useEventStore();
const selectedType = ref<string>('');

const typeOptions = computed(() => [
  { label: t('event.all'), value: '' },
  { label: t('nav.matches'), value: 'match' },
  { label: t('nav.trading'), value: 'trading' },
  { label: t('nav.tournaments'), value: 'tournament' },
]);

const filteredEvents = computed(() => {
  const events = eventStore.items;
  if (!selectedType.value) return events;
  return events.filter((e) => e.type === selectedType.value);
});

function filterParams(): Record<string, string> | undefined {
  return selectedType.value ? { type: selectedType.value } : undefined;
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

watch(selectedType, () => {
  eventStore.reset();
  void eventStore.list(filterParams());
});

onMounted(() => {
  void eventStore.list();
});
</script>

<style scoped>
.event-row__name {
  font-weight: 600;
  font-size: 0.875rem;
}

.event-row__time {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
</style>
