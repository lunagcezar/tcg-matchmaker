<template>
  <div class="event-feed">
    <div v-if="events.length === 0" class="text-center q-py-xl text-grey">
      {{ $t('home.noEvents') }}
    </div>
    <q-card
      v-for="event in events"
      :key="event.id as string"
      clickable
      class="q-mb-sm"
      :to="eventRoute(event)"
    >
      <q-card-section class="q-py-sm row items-center">
        <q-badge :color="eventColor(event.type as string)" class="q-mr-sm">{{
          event.type
        }}</q-badge>
        <div class="text-body2 text-weight-medium">{{ event.name || event.type }}</div>
        <q-space />
        <div class="text-caption text-grey">{{ relativeTime(event.scheduled_at as string) }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { eventColor } from '@/lib/colors';
import { eventRoute } from '@/lib/router';
import { relativeTime } from '@/lib/format';

defineProps<{ events: Array<Record<string, unknown>> }>();
</script>
