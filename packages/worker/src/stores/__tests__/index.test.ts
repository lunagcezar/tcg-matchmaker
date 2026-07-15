import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { storeRouter } from '../index.js';
import {
  env,
  testUserId,
  testUserId2,
  chain,
  makeApp,
  userChain,
  authMock,
} from '../../test-utils/supabase.js';

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
      const c = chain({ order: vi.fn().mockResolvedValue({ data: [storeData], error: null }) });
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(c),
      });

      const res = await makeApp().route('/api/stores', storeRouter).request('/api/stores', {}, env);
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

      const res = await makeApp()
        .route('/api/stores', storeRouter)
        .request('/api/stores', { method: 'POST' }, env);
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

      const res = await makeApp()
        .route('/api/stores', storeRouter)
        .request(
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

      const res = await makeApp()
        .route('/api/stores', storeRouter)
        .request(
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

      const res = await makeApp()
        .route('/api/stores', storeRouter)
        .request(
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

      const res = await makeApp()
        .route('/api/stores', storeRouter)
        .request(
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
