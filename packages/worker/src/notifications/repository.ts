import type { createSecretClient } from '../db/client.js';

export async function findNotifications(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function countUnread(supabase: ReturnType<typeof createSecretClient>, userId: string) {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}

export async function markRead(
  supabase: ReturnType<typeof createSecretClient>,
  notificationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();
  return { data, error };
}

export async function markAllRead(supabase: ReturnType<typeof createSecretClient>, userId: string) {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
}

export async function createPushSubscription(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  body: { endpoint: string; p256dh: string; auth: string; user_agent?: string },
) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({
      user_id: userId,
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.auth,
      user_agent: body.user_agent ?? null,
    })
    .select()
    .single();
  return { data, error };
}

export async function deletePushSubscription(
  supabase: ReturnType<typeof createSecretClient>,
  subscriptionId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .select('id')
    .single();
  return { data, error };
}
