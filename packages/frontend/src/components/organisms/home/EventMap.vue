<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{ events: Array<Record<string, unknown>> }>();
const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let markers: L.Marker[] = [];

const defaultCenter: [number, number] = [-3.7184, -38.5434]; // Fortaleza

function iconForType(type: string) {
  const colors: Record<string, string> = {
    match: 'var(--primary)',
    trading: '#21BA45',
    tournament: '#F2C037',
  };
  const color = colors[type] || 'var(--primary)';
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:${color};border-radius:50%;border:2px solid var(--background)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

onMounted(() => {
  if (!mapContainer.value) return;
  map = L.map(mapContainer.value).setView(defaultCenter, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
});

onUnmounted(() => {
  map?.remove();
});

watch(
  () => props.events,
  (events) => {
    markers.forEach((m) => map?.removeLayer(m));
    markers = [];
    events.forEach((e) => {
      const lat = e.lat as number;
      const lng = e.lng as number;
      if (!lat || !lng) return;
      const marker = L.marker([lat, lng], { icon: iconForType(e.type as string) })
        .addTo(map!)
        .bindPopup(`<b>${(e.name || e.type) as string}</b>`);
      markers.push(marker);
    });
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map?.fitBounds(group.getBounds().pad(0.1));
    }
  },
  { deep: true },
);
</script>

<style scoped>
.map-container {
  height: 50vh;
  min-height: 400px;
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
}
</style>
