import { defineStore } from 'pinia';
import { ref } from 'vue';
import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { apiGet, apiPost, apiPatch } from '@/composables/useApi';
import type { Notification } from '@/types/domain';

const supabaseUrl = import.meta.env.QCLI_SUPABASE_URL;
const supabaseKey = import.meta.env.QCLI_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let channel: RealtimeChannel | null = null;

  async function fetchNotifications() {
    loading.value = true;
    error.value = null;
    try {
      const json = (await apiGet('/api/notifications')) as { data: Notification[] };
      notifications.value = json.data ?? [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch notifications';
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadCount() {
    try {
      const json = (await apiGet('/api/notifications/unread-count')) as {
        data: { unread_count: number };
      };
      unreadCount.value = json.data?.unread_count ?? 0;
    } catch {
      // silent fail
    }
  }

  async function markAsRead(id: string) {
    try {
      await apiPatch(`/api/notifications/${id}/read`, {});
      const n = notifications.value.find((item) => item.id === id);
      if (n) {
        n.read_at = new Date().toISOString();
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch {
      // silent fail
    }
  }

  async function markAllAsRead() {
    try {
      await apiPost('/api/notifications/read-all');
      unreadCount.value = 0;
    } catch {
      // silent fail
    }
  }

  function subscribeRealtime(userId: string) {
    if (!supabase) return;
    channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes' as never,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Notification }) => {
          notifications.value = [payload.new, ...notifications.value];
          if (!payload.new.read_at) unreadCount.value += 1;
        },
      )
      .on(
        'postgres_changes' as never,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Notification }) => {
          const idx = notifications.value.findIndex((n) => n.id === payload.new.id);
          if (idx !== -1) notifications.value[idx] = payload.new;
        },
      )
      .subscribe();
  }

  function unsubscribeRealtime() {
    if (channel) {
      void supabase?.removeChannel(channel);
      channel = null;
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    subscribeRealtime,
    unsubscribeRealtime,
  };
});
