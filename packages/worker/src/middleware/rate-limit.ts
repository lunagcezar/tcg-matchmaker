import type { Context, Next } from 'hono';

type KV = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

export function rateLimitMiddleware(action: string, maxRequests: number, windowSeconds: number) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('CF-Connecting-IP') ?? '127.0.0.1';
    const key = `ratelimit:${action}:${ip}`;

    const kv = c.env?.RATE_LIMIT_KV as KV | undefined;
    if (!kv) {
      await next();
      return;
    }

    const current = await kv.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= maxRequests) {
      return c.json({ data: null, error: 'Too many requests. Try again later.', meta: null }, 429);
    }

    await kv.put(key, String(count + 1), { expirationTtl: windowSeconds });
    await next();
  };
}
