import { CreatePushSubscriptionSchema } from '@tcg/shared';
import { Hono } from 'hono';

import { result, badRequest, notFound } from '../lib/responses.js';
import { validate } from '../lib/validation.js';
import { authMiddleware } from '../middleware/auth.js';
import type { Bindings, Variables } from '../types/hono.js';
import {
  listNotifications,
  getUnreadCount,
  readNotification,
  readAllNotifications,
  addPushSubscription,
  removePushSubscription,
} from './service.js';

const notificationRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
const pushSubscriptionRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

notificationRouter.get('/', authMiddleware, async (c) => {
  return result(c, await listNotifications(c.var.db, c.var.user.id));
});

notificationRouter.get('/unread-count', authMiddleware, async (c) => {
  return result(c, await getUnreadCount(c.var.db, c.var.user.id));
});

notificationRouter.patch('/:id/read', authMiddleware, async (c) => {
  const svcResult = await readNotification(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

notificationRouter.post('/read-all', authMiddleware, async (c) => {
  return result(c, await readAllNotifications(c.var.db, c.var.user.id));
});

pushSubscriptionRouter.post('/', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = validate(CreatePushSubscriptionSchema, body);
  if (!parsed.success) {
    return badRequest(c, parsed.error);
  }
  const svcResult = await addPushSubscription(c.var.db, c.var.user.id, parsed.data);
  if (svcResult.error) return badRequest(c, svcResult.error);
  return result(c, svcResult, 201);
});

pushSubscriptionRouter.delete('/:id', authMiddleware, async (c) => {
  const svcResult = await removePushSubscription(c.var.db, c.var.user.id, c.req.param('id')!);
  if (!svcResult.data) return notFound(c, svcResult.error ?? undefined);
  return result(c, svcResult);
});

export { notificationRouter, pushSubscriptionRouter };
