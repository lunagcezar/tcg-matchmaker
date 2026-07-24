<template>
  <q-infinite-scroll :offset="250" :scroll-target="scrollTarget" @load="onLoad">
    <div class="event-feed">
      <div v-if="events.length === 0 && !loading" class="text-center q-py-xl text-grey">
        {{ $t('home.noEvents') }}
      </div>
      <router-link
        v-for="event in events"
        :key="event.id as string"
        :to="eventRoute(event)"
        class="event-feed__row"
      >
        <q-badge :color="eventColor(event.type as string)" class="q-mr-sm">
          {{ event.type }}
        </q-badge>
        <q-badge :color="statusColor(event.status as string)" outline class="q-mr-sm">
          {{ event.status }}
        </q-badge>
        <div class="event-feed__name">{{ event.name || event.type }}</div>
        <q-space />
        <div class="event-feed__time">{{ relativeTime(event.scheduled_at as string) }}</div>
      </router-link>
    </div>
    <template #loading>
      <div class="row justify-center q-my-md">
        <q-spinner color="primary" size="2rem" />
      </div>
    </template>
  </q-infinite-scroll>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { eventColor, statusColor } from '@/lib/colors';
import { eventRoute } from '@/lib/router';
import { relativeTime } from '@/lib/format';

defineProps<{
  events: Array<Record<string, unknown>>;
  loading?: boolean;
  scrollTarget?: Element | string;
}>();
const emit = defineEmits<{ (e: 'loadMore', done: (stop?: boolean) => void): void }>();

function onLoad(_index: number, done: (stop?: boolean) => void) {
  emit('loadMore', done);
}
</script>

<style scoped>
.event-feed {
  display: flex;
  flex-direction: column;
}

.event-feed__row {
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

.event-feed__row:hover {
  background-color: var(--muted);
}

.event-feed__row:first-child {
  border-top: 1px solid var(--border);
}

.event-feed__name {
  font-weight: 600;
  font-size: 0.875rem;
}

.event-feed__time {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
</style>
