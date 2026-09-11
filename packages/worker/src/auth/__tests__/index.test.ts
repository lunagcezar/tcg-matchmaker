import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { env, testUserId, chain, authMock, createTestApp } from '../../test-utils/supabase.js';
import { authRouter } from '../index.js';

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

      const res = await createTestApp('/api/auth', authRouter).request(
        '/api/auth/onboarding',
        {},
        env,
      );
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

      const res = await createTestApp('/api/auth', authRouter).request(
        '/api/auth/onboarding',
        {},
        env,
      );
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

      const res = await createTestApp('/api/auth', authRouter).request('/api/auth/me', {}, env);
      expect(res.status).toBe(401);
    });

    it('returns user profile when authenticated', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const c = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: testUserId,
            username: 'testuser',
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

      const res = await createTestApp('/api/auth', authRouter).request(
        '/api/auth/me',
        { headers: { Authorization: 'Bearer t' } },
        env,
      );
      const body = (await res.json()) as { data: { username: string } };
      expect(body.data.username).toBe('testuser');
    });
  });

  describe('POST /api/auth/onboarding', () => {
    it('creates the first admin and returns 201', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const adminId = '00000000-0000-0000-0000-000000000099';

      const adminCheckChain = chain({
        is: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: {
          getUser: vi.fn(),
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: { id: adminId } },
              error: null,
            }),
            deleteUser: vi.fn(),
          },
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return adminCheckChain;
          }
          if (table === 'consents') return chain({ insert: vi.fn().mockReturnThis() });
          return chain();
        }),
      });

      const res = await createTestApp('/api/auth', authRouter).request(
        '/api/auth/onboarding',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@test.com',
            password: 'password123',
            username: 'firstadmin',
          }),
        },
        env,
      );
      expect(res.status).toBe(201);
    });

    it('returns 409 when username is already taken', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      let callCount = 0;
      const mockChain = chain({
        maybeSingle: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              data: {
                id: testUserId,
                email: 'a@b.com',
                username: 'u',
                role: 'player',
                banned_at: null,
                deleted_at: null,
              },
              error: null,
            });
          }
          return Promise.resolve({
            data: { id: '00000000-0000-0000-0000-000000000099' },
            error: null,
          });
        }),
        single: vi.fn().mockResolvedValue({
          data: {
            id: testUserId,
            email: 'a@b.com',
            username: 'existing',
            role: 'player',
            banned_at: null,
            created_at: '2026-01-01T00:00:00.000Z',
          },
          error: null,
        }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: testUserId } }, error: null }),
        },
        from: vi.fn().mockReturnValue(mockChain),
      });

      const res = await createTestApp('/api/auth', authRouter).request(
        '/api/auth/profile',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer t',
          },
          body: JSON.stringify({ username: 'taken' }),
        },
        env,
      );
      expect(res.status).toBe(409);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('Username already taken');
    });

    it('returns 400 when admin already exists', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const c = chain({ is: vi.fn().mockResolvedValue({ data: null, error: null, count: 1 }) });
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: { getUser: vi.fn(), admin: { createUser: vi.fn(), deleteUser: vi.fn() } },
        from: vi.fn().mockReturnValue(c),
      });

      const res = await createTestApp('/api/auth', authRouter).request(
        '/api/auth/onboarding',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@test.com',
            password: 'password123',
            username: 'firstadmin',
          }),
        },
        env,
      );
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('Admin already exists');
    });
  });
});
