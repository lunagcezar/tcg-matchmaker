import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable(),
  read_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const PushSubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  user_agent: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;
