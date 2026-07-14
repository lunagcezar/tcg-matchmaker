import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { rateLimitMiddleware } from '../rate-limit.js';

const mockKv = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeApp(action = 'test', max = 3, windowSec = 60) {
  const app = new Hono<{ Bindings: { RATE_LIMIT_KV: typeof mockKv } }>();
  app.use('*', rateLimitMiddleware(action, max, windowSec));
  app.get('/', (c) => c.json({ ok: true }));
  return app;
}

describe('rateLimitMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows requests under the limit', async () => {
    mockKv.get.mockResolvedValue(null);
    const res = await makeApp().request('/', {}, { RATE_LIMIT_KV: mockKv });
    expect(res.status).toBe(200);
    expect(mockKv.put).toHaveBeenCalledWith(
      'ratelimit:test:127.0.0.1',
      '1',
      expect.objectContaining({ expirationTtl: 60 }),
    );
  });

  it('blocks requests at the limit with 429', async () => {
    mockKv.get.mockResolvedValue('3');
    const res = await makeApp().request('/', {}, { RATE_LIMIT_KV: mockKv });
    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('Too many requests');
  });

  it('allows requests under the limit after incrementing', async () => {
    mockKv.get.mockResolvedValue('2');
    const res = await makeApp('login', 5, 900).request('/', {}, { RATE_LIMIT_KV: mockKv });
    expect(res.status).toBe(200);
    expect(mockKv.put).toHaveBeenCalledWith(
      'ratelimit:login:127.0.0.1',
      '3',
      expect.objectContaining({ expirationTtl: 900 }),
    );
  });

  it('extracts IP from CF-Connecting-IP header', async () => {
    mockKv.get.mockResolvedValue(null);
    const res = await makeApp().request(
      '/',
      {
        headers: { 'CF-Connecting-IP': '203.0.113.42' },
      },
      { RATE_LIMIT_KV: mockKv },
    );
    expect(res.status).toBe(200);
    expect(mockKv.put).toHaveBeenCalledWith('ratelimit:test:203.0.113.42', '1', expect.any(Object));
  });
});
