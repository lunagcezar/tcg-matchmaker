import { ROLES } from '@tcg/shared';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import {
  env,
  testUserId,
  testUserId2,
  chain,
  createTestApp,
  userChain,
  authMock,
} from '../../test-utils/supabase.js';
import { storeRouter } from '../index.js';

const storeId = '00000000-0000-0000-0000-000000000100';

const storeData = {
  id: storeId,
  name: 'Test Store',
  slug: 'test-store',
  description: null,
  country: 'Brasil',
  state: 'Ceará',
  city: 'Fortaleza',
  address: 'Rua Teste, 123',
  lat: -3.7,
  lng: -38.5,
  phone: null,
  website: null,
  logo_path: null,
  created_by_user_id: testUserId,
  is_verified: false,
  status: 'active',
  suspended_at: null,
  suspension_reason: null,
  created_at: '2026-07-14T00:00:00.000Z',
  updated_at: '2026-07-14T00:00:00.000Z',
  deleted_at: null,
};

describe('Store routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/stores', () => {
    it('returns a list of active stores', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const c = chain({ limit: vi.fn().mockResolvedValue({ data: [storeData], error: null }) });
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(c),
      });

      const res = await createTestApp('/api/stores', storeRouter).request('/api/stores', {}, env);
      const body = (await res.json()) as { data: Array<{ name: string }> };
      expect(body.data[0].name).toBe('Test Store');
    });
  });

  describe('POST /api/stores', () => {
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

      const res = await createTestApp('/api/stores', storeRouter).request(
        '/api/stores',
        { method: 'POST' },
        env,
      );
      expect(res.status).toBe(401);
    });

    it('creates a store and returns 201', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const sChain = chain({
        single: vi.fn().mockResolvedValue({ data: storeData, error: null }),
        insert: vi.fn().mockReturnThis(),
      });
      const mChain = chain();

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'game_stores') return sChain;
          if (t === 'store_memberships') return mChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/stores', storeRouter).request(
        '/api/stores',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Store',
            address: 'Rua Teste, 123',
            lat: -3.7,
            lng: -38.5,
          }),
        },
        env,
      );
      expect(res.status).toBe(201);
    });
  });

  describe('PATCH /api/stores/:id', () => {
    it('returns 403 when user is not a member', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mChain = chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(testUserId2),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain(testUserId2);
          if (t === 'store_memberships') return mChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/stores', storeRouter).request(
        `/api/stores/${storeId}`,
        {
          method: 'PATCH',
          headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated' }),
        },
        env,
      );
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/stores/:id/verify', () => {
    it('returns 403 when user is not admin', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue(authMock(testUserId2));

      const res = await createTestApp('/api/stores', storeRouter).request(
        `/api/stores/${storeId}/verify`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/stores/:id', () => {
    it('returns the store with viewer_role null for anonymous callers', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const sChain = chain({ single: vi.fn().mockResolvedValue({ data: storeData, error: null }) });
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(sChain),
      });

      const res = await createTestApp('/api/stores', storeRouter).request(
        `/api/stores/${storeId}`,
        {},
        env,
      );
      const body = (await res.json()) as { data: { name: string; viewer_role: string | null } };
      expect(res.status).toBe(200);
      expect(body.data.name).toBe('Test Store');
      expect(body.data.viewer_role).toBeNull();
    });

    it('sets viewer_role to the membership role for a store member', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const sChain = chain({ single: vi.fn().mockResolvedValue({ data: storeData, error: null }) });
      const mChain = chain({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { store_id: storeId, user_id: testUserId, role: 'manager' },
          error: null,
        }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'game_stores') return sChain;
          if (t === 'store_memberships') return mChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/stores', storeRouter).request(
        `/api/stores/${storeId}`,
        { headers: { Authorization: 'Bearer t' } },
        env,
      );
      const body = (await res.json()) as { data: { viewer_role: string | null } };
      expect(res.status).toBe(200);
      expect(body.data.viewer_role).toBe('manager');
    });

    it('sets viewer_role to "admin" for an admin viewer', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const sChain = chain({ single: vi.fn().mockResolvedValue({ data: storeData, error: null }) });
      const adminChain = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: testUserId2,
            email: 'admin@test.com',
            username: 'admin',
            role: ROLES[2],
            banned_at: null,
            deleted_at: null,
          },
          error: null,
        }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(testUserId2),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return adminChain;
          if (t === 'game_stores') return sChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/stores', storeRouter).request(
        `/api/stores/${storeId}`,
        { headers: { Authorization: 'Bearer t' } },
        env,
      );
      const body = (await res.json()) as { data: { viewer_role: string | null } };
      expect(res.status).toBe(200);
      expect(body.data.viewer_role).toBe(ROLES[2]);
    });

    it('sets viewer_role to null for an authenticated non-member', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const sChain = chain({ single: vi.fn().mockResolvedValue({ data: storeData, error: null }) });
      const mChain = chain({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'game_stores') return sChain;
          if (t === 'store_memberships') return mChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/stores', storeRouter).request(
        `/api/stores/${storeId}`,
        { headers: { Authorization: 'Bearer t' } },
        env,
      );
      const body = (await res.json()) as { data: { viewer_role: string | null } };
      expect(res.status).toBe(200);
      expect(body.data.viewer_role).toBeNull();
    });
  });

  describe('GET /api/stores/:id/members', () => {
    it('returns 200 with members for an admin regardless of membership', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const adminChain = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: testUserId2,
            email: 'admin@test.com',
            username: 'admin',
            role: ROLES[2],
            banned_at: null,
            deleted_at: null,
          },
          error: null,
        }),
      });
      const mChain = chain({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'm1',
              store_id: storeId,
              user_id: testUserId,
              role: 'owner',
              users: { username: 'owner' },
            },
          ],
          error: null,
        }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(testUserId2),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return adminChain;
          if (t === 'store_memberships') return mChain;
          return chain();
        }),
      });

      const res = await createTestApp('/api/stores', storeRouter).request(
        `/api/stores/${storeId}/members`,
        { headers: { Authorization: 'Bearer t' } },
        env,
      );
      const body = (await res.json()) as { data: Array<{ username: string }> };
      expect(res.status).toBe(200);
      expect(body.data[0].username).toBe('owner');
    });
  });

  describe('GET /api/stores/:id/members', () => {
    it('returns list of members', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mChain = chain({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { store_id: storeId, user_id: testUserId, role: 'owner' },
          error: null,
        }),
      });
      const lChain = chain({ order: vi.fn().mockResolvedValue({ data: [], error: null }) });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'store_memberships') return mChain;
          return lChain;
        }),
      });

      const res = await createTestApp('/api/stores', storeRouter).request(
        `/api/stores/${storeId}/members`,
        {
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(200);
    });
  });
});
