<template>
  <q-page class="map-list-layout">
    <section v-if="$slots.map" class="ml-map-section">
      <slot name="map" />
    </section>
    <section class="ml-list-section">
      <div class="ml-sticky-bar">
        <slot name="filters" />
      </div>
      <div ref="scrollRef" class="ml-scroll-area">
        <div v-if="items.length === 0 && !loading" class="text-center q-py-xl text-grey">
          {{ emptyText }}
        </div>
        <slot name="items" />
        <div v-if="$slots['loading-indicator'] && loading" class="row justify-center q-my-md">
          <slot name="loading-indicator" />
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue';

import { MapListScrollRefKey } from '@/lib/injectionKeys';

defineProps<{
  items: unknown[];
  loading: boolean;
  emptyText?: string;
}>();

const scrollRef = ref<HTMLElement | null>(null);

provide(MapListScrollRefKey, scrollRef);

defineExpose({ scrollRef });
</script>

<style scoped>
.map-list-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  gap: 0;
}

.ml-map-section {
  flex: 0 0 40vh;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  margin: 0.75rem 0.75rem 0 0.75rem;
}

.ml-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0.75rem;
  min-height: 0;
}

.ml-sticky-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-bottom: 0.75rem;
}

.ml-scroll-area {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
</style>
