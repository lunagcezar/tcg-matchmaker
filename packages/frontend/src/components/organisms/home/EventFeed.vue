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
      :to="detailRoute(event)"
    >
      <q-card-section class="q-py-sm row items-center">
        <q-badge :color="badgeColor(event.type as string)" class="q-mr-sm">{{
          event.type
        }}</q-badge>
        <div class="text-body2 text-weight-medium">{{ event.name || event.type }}</div>
        <q-space />
        <div class="text-caption text-grey">{{ timeAgo(event.scheduled_at as string) }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
defineProps<{ events: Array<Record<string, unknown>> }>();

function badgeColor(type: string) {
  return type === 'match' ? 'primary' : type === 'trading' ? 'positive' : 'warning';
}

function detailRoute(event: Record<string, unknown>) {
  const type = event.type as string;
  const id = event.id as string;
  if (type === 'match') return `/matches/${id}`;
  if (type === 'trading') return `/trading/${id}`;
  return `/tournaments/${id}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
</script>
