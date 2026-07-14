<template>
  <q-page class="home-page">
    <FilterBar v-model="selectedTypes" @geolocate="geolocate" />
    <div class="row" style="height: calc(100vh - 120px)">
      <div class="col-12 col-md-7 q-pa-sm">
        <EventMap :events="filteredEvents" />
      </div>
      <div class="col-12 col-md-5 q-pa-sm overflow-auto">
        <EventFeed :events="filteredEvents" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';
import FilterBar from '@/components/organisms/home/FilterBar.vue';
import EventFeed from '@/components/organisms/home/EventFeed.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';

const eventStore = useEventStore();
const selectedTypes = ref<string[]>([]);

const filteredEvents = computed(() => {
  const events = eventStore.items;
  if (selectedTypes.value.length === 0) return events;
  return events.filter((e) => selectedTypes.value.includes(e.type as string));
});

function geolocate() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      () => { /* map already centers on user via Leaflet */ },
      () => { /* permission denied, stay at default */ },
    );
  }
}

onMounted(() => {
  void eventStore.list();
});
</script>

<style scoped>
.home-page { overflow: hidden; }
</style>
