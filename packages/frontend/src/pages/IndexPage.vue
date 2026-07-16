<template>
  <q-page class="home-page">
    <section class="map-section">
      <EventMap :events="filteredEvents" />
    </section>
    <section class="feed-section">
      <FilterBar v-model="selectedTypes" @geolocate="geolocate" />
      <EventFeed :events="filteredEvents" />
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import FilterBar from '@/components/organisms/home/FilterBar.vue';
import EventFeed from '@/components/organisms/home/EventFeed.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';

usePageMeta({ titleKey: 'meta.home', descKey: 'meta.homeDesc' });

const eventStore = useEventStore();
const selectedTypes = ref<string[]>([]);

const filteredEvents = computed(() => {
  const events = eventStore.items;
  if (selectedTypes.value.length === 0) return events;
  return events.filter((e) => selectedTypes.value.includes(e.type));
});

function geolocate() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      () => {
        /* map already centers on user via Leaflet */
      },
      () => {
        /* permission denied, stay at default */
      },
    );
  }
}

onMounted(() => {
  void eventStore.list();
});
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.map-section {
  min-height: 50vh;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}

.feed-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
