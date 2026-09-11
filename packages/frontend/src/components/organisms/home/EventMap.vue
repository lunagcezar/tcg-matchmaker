<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import L from 'leaflet';
import { useQuasar } from 'quasar';
import { ref, onMounted, onUnmounted, watch } from 'vue';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

const props = defineProps<{ events: Array<Record<string, unknown>> }>();
const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let markerGroup: L.MarkerClusterGroup | null = null;
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
  if (!markerGroup) return;
  markerGroup.clearLayers();
  const latlngs: L.LatLng[] = [];
  props.events.forEach((e) => {
    const lat = e.lat as number;
    const lng = e.lng as number;
    if (!lat || !lng) return;
    latlngs.push(L.latLng(lat, lng));
    const marker = L.marker([lat, lng], { icon: iconForType(e.type as string) });
    marker.bindPopup(`<b>${(e.name || e.type) as string}</b>`);
    markerGroup!.addLayer(marker);
  });
  if (latlngs.length > 0) {
    map?.fitBounds(L.latLngBounds(latlngs).pad(0.1), { animate: false, duration: 0 });
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
    zoomControl: false,
  });
  markerGroup = L.markerClusterGroup({ chunkedLoading: true });
  map.addLayer(markerGroup);
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
  background: var(--background);
}

.map-container :deep(.leaflet-layer),
.map-container :deep(.leaflet-tile-pane) {
  background: var(--background);
}
</style>
