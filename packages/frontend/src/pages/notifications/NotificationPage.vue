<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <h5 class="q-my-none q-mr-md">{{ $t('notifications.title') }}</h5>
      <q-space />
      <q-btn
        :label="$t('notifications.markAllRead')"
        flat
        color="primary"
        :disable="unreadCount === 0"
        @click="handleMarkAllRead"
      />
    </div>

    <q-list v-if="notifications.length > 0" bordered separator>
      <q-item
        v-for="n in notifications"
        :key="n.id"
        clickable
        :class="{ 'bg-grey-1': !n.read_at }"
        @click="handleClick(n)"
      >
        <q-item-section avatar>
          <q-icon :name="iconForType(n.type)" :color="n.read_at ? 'grey' : 'primary'" size="md" />
        </q-item-section>
        <q-item-section>
          <q-item-label :class="{ 'text-weight-bold': !n.read_at }">{{ n.title }}</q-item-label>
          <q-item-label caption>{{ n.body }}</q-item-label>
          <q-item-label caption class="text-caption text-grey">{{
            formattedDate(n.created_at)
          }}</q-item-label>
        </q-item-section>
        <q-item-section v-if="!n.read_at" side>
          <q-badge rounded color="primary" size="sm" />
        </q-item-section>
        <q-item-section side>
          <q-btn
            v-if="!n.read_at"
            flat
            dense
            round
            icon="done"
            size="sm"
            @click.stop="markAsRead(n.id)"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else-if="!loading" class="text-center text-grey q-py-xl">
      {{ $t('notifications.empty') }}
    </div>
    <div v-else class="text-center q-py-xl">
      <q-spinner-dots size="3rem" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotifications } from '@/composables/useNotifications';

const router = useRouter();
const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } =
  useNotifications();

onMounted(() => {
  void fetchNotifications();
});

function iconForType(type: string): string {
  if (type.includes('invite') || type.includes('challenge')) return 'mail';
  if (type.includes('bracket') || type.includes('advance') || type.includes('tournament'))
    return 'emoji_events';
  if (type.includes('store') || type.includes('moderation')) return 'gavel';
  if (type.includes('rsvp') || type.includes('confirm')) return 'event';
  return 'notifications';
}

function formattedDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

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
  notifications.value.forEach((n) => {
    n.read_at = new Date().toISOString();
  });
}
</script>
