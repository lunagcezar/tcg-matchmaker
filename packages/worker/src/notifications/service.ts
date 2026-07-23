import type { createSecretClient } from '../db/client.js';
import {
  findNotifications,
  countUnread,
  markRead,
  markAllRead,
  createPushSubscription,
  deletePushSubscription,
} from './repository.js';

export async function listNotifications(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
) {
  const data = await findNotifications(supabase, userId);
  return { data, error: null, meta: null };
}

export async function getUnreadCount(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
) {
  const unread_count = await countUnread(supabase, userId);
  return { data: { unread_count }, error: null, meta: null };
}

export async function readNotification(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  notificationId: string,
) {
  const { data, error } = await markRead(supabase, notificationId, userId);
  if (error || !data) {
    return { data: null, error: 'Notification not found', meta: null };
  }
  return { data, error: null, meta: null };
}

export async function readAllNotifications(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
) {
  await markAllRead(supabase, userId);
  return { data: { success: true }, error: null, meta: null };
}

export async function addPushSubscription(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  body: { endpoint: string; p256dh: string; auth: string; user_agent?: string },
) {
  const { data, error } = await createPushSubscription(supabase, userId, body);
  if (error) {
    return { data: null, error: error.message, meta: null };
  }
  return { data, error: null, meta: null };
}

export async function removePushSubscription(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  subscriptionId: string,
) {
  const { data, error } = await deletePushSubscription(supabase, subscriptionId, userId);
  if (error || !data) {
    return { data: null, error: 'Subscription not found', meta: null };
  }
  return { data: { success: true }, error: null, meta: null };
}
