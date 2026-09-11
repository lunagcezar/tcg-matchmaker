import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import {
  env,
  testUserId,
  chain,
  createTestApp,
  userChain,
  authMock,
} from '../../test-utils/supabase.js';
import { notificationRouter } from '../index.js';

const notificationId = '00000000-0000-0000-0000-000000000100';

describe('Notification routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('returns 401 when not authenticated', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: {
          getUser: vi
            .fn()
            .mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
        from: vi.fn(),
      });

      const res = await createTestApp('/api/notifications', notificationRouter).request(
        '/api/notifications',
        {},
        env,
      );
      expect(res.status).toBe(401);
    });

    it("returns user's notifications", async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const nChain = chain({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'notifications') return nChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/notifications', notificationRouter).request(
        '/api/notifications',
        {
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('marks a notification as read', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const nChain = chain({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: notificationId,
            user_id: testUserId,
            type: 'test',
            title: 'Test',
            body: 'Hello',
            data: null,
            read_at: '2026-07-14T18:00:00.000Z',
            created_at: '2026-07-14T17:00:00.000Z',
          },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'notifications') return nChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/notifications', notificationRouter).request(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/notifications/read-all', () => {
    it('marks all as read', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const nChain = chain({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'notifications') return nChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/notifications', notificationRouter).request(
        '/api/notifications/read-all',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('returns unread count', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const nChain = chain({
        is: vi.fn().mockResolvedValue({ data: null, error: null, count: 3 }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'notifications') return nChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/notifications', notificationRouter).request(
        '/api/notifications/unread-count',
        {
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(200);
    });
  });
});
