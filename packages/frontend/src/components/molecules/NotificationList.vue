<template>
  <q-list style="min-width: 300px; max-height: 400px; overflow-y: auto;">
    <q-item v-if="loading">
      <q-item-section><q-spinner-dots size="2rem" /></q-item-section>
    </q-item>
    <q-item v-else-if="notifications.length === 0">
      <q-item-section class="text-grey text-center">{{ $t('notifications.empty') }}</q-item-section>
    </q-item>
    <template v-else>
      <q-item v-for="n in recentNotifications" :key="n.id" clickable v-close-popup @click="handleClick(n)">
        <q-item-section avatar>
          <q-icon :name="iconForType(n.type)" :color="n.read_at ? 'grey' : 'primary'" />
        </q-item-section>
        <q-item-section>
          <q-item-label :class="{ 'text-weight-bold': !n.read_at }">{{ n.title }}</q-item-label>
          <q-item-label caption>{{ n.body }}</q-item-label>
          <q-item-label caption class="text-caption text-grey">{{ relativeTime(n.created_at) }}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="!n.read_at">
          <q-badge rounded color="primary" size="sm" />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-close-popup to="/notifications">
        <q-item-section class="text-center text-primary">{{ $t('notifications.viewAll') }}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="handleMarkAllRead" v-if="unreadCount > 0">
        <q-item-section class="text-center text-grey">{{ $t('notifications.markAllRead') }}</q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotifications } from '@/composables/useNotifications';

const router = useRouter();
const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

const recentNotifications = computed(() => notifications.value.slice(0, 5));

onMounted(() => { void fetchNotifications(); });

function iconForType(type: string): string {
  if (type.includes('invite') || type.includes('challenge')) return 'mail';
  if (type.includes('bracket') || type.includes('advance') || type.includes('tournament')) return 'emoji_events';
  if (type.includes('store') || type.includes('moderation')) return 'gavel';
  if (type.includes('rsvp') || type.includes('confirm')) return 'event';
  return 'notifications';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

async function handleClick(n: { id: string; read_at: string | null; data: Record<string, unknown> | null }) {
  if (!n.read_at) await markAsRead(n.id);
  const path = n.data?.path;
  if (typeof path === 'string') void router.push(path);
}

async function handleMarkAllRead() {
  await markAllAsRead();
}
</script>
