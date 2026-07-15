<template>
  <q-btn-dropdown flat icon="notifications" v-if="authStore.user">
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
import { useNotifications } from '@/composables/useNotifications';
import NotificationList from './NotificationList.vue';

const authStore = useAuthStore();
const { unreadCount, fetchUnreadCount, subscribeRealtime, unsubscribeRealtime } = useNotifications();

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
