import { ref, type Ref } from 'vue';
import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { getClient } from '@/composables/useApi';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const notifications: Ref<Notification[]> = ref([]);
  const unreadCount: Ref<number> = ref(0);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  let channel: RealtimeChannel | null = null;

  async function fetchNotifications() {
    loading.value = true;
    error.value = null;
    try {
      const res = await getClient().api.notifications.$get();
      const json = (await res.json()) as { data: Notification[] };
      notifications.value = json.data ?? [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch notifications';
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadCount() {
    try {
      const res = await getClient().api.notifications['unread-count'].$get();
      const json = (await res.json()) as { data: { unread_count: number } };
      unreadCount.value = json.data?.unread_count ?? 0;
    } catch {
      // silent fail
    }
  }

  async function markAsRead(id: string) {
    try {
      await getClient().api.notifications[':id'].read.$patch({ param: { id } });
      const n = notifications.value.find((n) => n.id === id);
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
      await getClient().api.notifications['read-all'].$post();
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
          if (!payload.new.read_at) {
            unreadCount.value += 1;
          }
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
          if (idx !== -1) {
            notifications.value[idx] = payload.new;
          }
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
}
