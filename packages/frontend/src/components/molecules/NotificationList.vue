<template>
  <q-list style="min-width: 300px; max-height: 400px; overflow-y: auto">
    <q-item v-if="loading">
      <q-item-section><q-spinner-dots size="2rem" /></q-item-section>
    </q-item>
    <q-item v-else-if="notifications.length === 0">
      <q-item-section class="text-grey text-center">{{ $t('notifications.empty') }}</q-item-section>
    </q-item>
    <template v-else>
      <q-item
        v-for="n in recentNotifications"
        :key="n.id"
        v-close-popup
        clickable
        @click="handleClick(n)"
      >
        <q-item-section avatar>
          <q-icon :name="notificationIcon(n.type)" :color="n.read_at ? 'grey' : 'primary'" />
        </q-item-section>
        <q-item-section>
          <q-item-label :class="{ 'text-weight-bold': !n.read_at }">{{ n.title }}</q-item-label>
          <q-item-label caption>{{ n.body }}</q-item-label>
          <q-item-label caption class="text-caption text-grey">{{
            relativeTime(n.created_at)
          }}</q-item-label>
        </q-item-section>
        <q-item-section v-if="!n.read_at" side>
          <q-badge rounded color="primary" size="sm" />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item v-close-popup clickable to="/notifications">
        <q-item-section class="text-center text-primary">{{
          $t('notifications.viewAll')
        }}</q-item-section>
      </q-item>
      <q-item v-if="unreadCount > 0" v-close-popup clickable @click="handleMarkAllRead">
        <q-item-section class="text-center text-grey">{{
          $t('notifications.markAllRead')
        }}</q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotifications } from '@/composables/useNotifications';
import { relativeTime } from '@/lib/format';
import { notificationIcon } from '@/lib/colors';

const router = useRouter();
const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } =
  useNotifications();

const recentNotifications = computed(() => notifications.value.slice(0, 5));

onMounted(() => {
  void fetchNotifications();
});

async function handleClick(n: {
  id: string;
  read_at: string | null;
  data: Record<string, unknown> | null;
}) {
  if (!n.read_at) await markAsRead(n.id);
  const path = n.data?.path;
  if (typeof path === 'string') void router.push(path);
}

async function handleMarkAllRead() {
  await markAllAsRead();
}
</script>
