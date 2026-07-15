import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { Hono } from 'hono';
import { authRouter } from '../index.js';
import { env, testUserId, chain, authMock } from '../../test-utils/supabase.js';

function createTestApp() {
  return new Hono<{
    Bindings: typeof env;
    Variables: { user: { id: string; email: string; username: string; role: string } };
  }>().route('/api/auth', authRouter);
}

describe('Auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/auth/onboarding', () => {
    it('returns hasAdmin: false when no admin exists', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const c = chain({ is: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }) });
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(c),
      });

      const res = await createTestApp().request('/api/auth/onboarding', {}, env);
      const body = (await res.json()) as { data: { hasAdmin: boolean } };
      expect(body.data.hasAdmin).toBe(false);
    });

    it('returns hasAdmin: true when admin exists', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const c = chain({ is: vi.fn().mockResolvedValue({ data: null, error: null, count: 1 }) });
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(c),
      });

      const res = await createTestApp().request('/api/auth/onboarding', {}, env);
      const body = (await res.json()) as { data: { hasAdmin: boolean } };
      expect(body.data.hasAdmin).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 when not authenticated', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        auth: {
          getUser: vi
            .fn()
            .mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
      });

      const res = await createTestApp().request('/api/auth/me', {}, env);
      expect(res.status).toBe(401);
    });

    it('returns user profile when authenticated', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const c = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: testUserId,
            username: 'testuser',
            display_name: 'Test User',
            role: 'player',
            avatar_path: null,
            banned_at: null,
            suspended_at: null,
            created_at: '2026-01-01T00:00:00.000Z',
          },
          error: null,
        }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((table: string) => (table === 'users' ? c : chain())),
      });

      const res = await createTestApp().request(
        '/api/auth/me',
        { headers: { Authorization: 'Bearer t' } },
        env,
      );
      const body = (await res.json()) as { data: { username: string } };
      expect(body.data.username).toBe('testuser');
    });
  });
});
