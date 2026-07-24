<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{ events: Array<Record<string, unknown>> }>();
const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let markers: L.Marker[] = [];
let tileLayer: L.TileLayer | null = null;
const $q = useQuasar();
const defaultCenter: [number, number] = [-3.7184, -38.5434];

function tileUrl(): string {
  return $q.dark.isActive
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
}

function updateTiles() {
  if (!map) return;
  if (tileLayer) map.removeLayer(tileLayer);
  tileLayer = L.tileLayer(tileUrl()).addTo(map);
}

function iconForType(type: string) {
  const colors: Record<string, string> = {
    match: 'var(--primary)',
    trading: '#21BA45',
    tournament: '#F2C037',
  };
  const color = colors[type] || 'var(--primary)';
  const bg = $q.dark.isActive ? '#1e1e2e' : '#ffffff';
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:${color};border-radius:50%;border:2px solid ${bg}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function rebuildMarkers() {
  markers.forEach((m) => map?.removeLayer(m));
  markers = [];
  props.events.forEach((e) => {
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
    map?.fitBounds(group.getBounds().pad(0.1), { animate: false, duration: 0 });
  }
}

watch(
  () => $q.dark.isActive,
  () => {
    updateTiles();
    rebuildMarkers();
  },
);

watch(
  () => props.events,
  () => {
    rebuildMarkers();
  },
  { deep: true },
);

onMounted(() => {
  if (!mapContainer.value) return;
  map = L.map(mapContainer.value, {
    attributionControl: false,
    zoomControl: true,
  });
  tileLayer = L.tileLayer(tileUrl()).addTo(map);
  if (props.events.length > 0) {
    rebuildMarkers();
  } else {
    map.setView(defaultCenter, 13);
  }
});

onUnmounted(() => {
  map?.remove();
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.map-container :deep(.leaflet-control-zoom) {
  z-index: 400;
}
</style>
