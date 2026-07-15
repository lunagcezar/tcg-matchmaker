<template>
  <q-btn-dropdown v-if="authStore.user" flat icon="notifications">
    <template #label>
      <q-icon name="notifications" />
      <q-badge v-if="unreadCount > 0" floating color="red" rounded>
        {{ displayCount }}
      </q-badge>
    </template>
    <NotificationList />
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import NotificationList from './NotificationList.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const { unreadCount, fetchUnreadCount, subscribeRealtime, unsubscribeRealtime } = notificationStore;

const displayCount = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)));

let interval: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  if (authStore.user) {
    void fetchUnreadCount();
    subscribeRealtime(authStore.user.id);
    interval = setInterval(() => void fetchUnreadCount(), 30000);
  }
});
onUnmounted(() => {
  if (interval) clearInterval(interval);
  unsubscribeRealtime();
});
</script>
