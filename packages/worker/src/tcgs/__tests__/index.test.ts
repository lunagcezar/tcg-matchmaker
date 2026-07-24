import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { tcgRouter } from '../index.js';
import { env, testUserId2, chain, createTestApp, authMock } from '../../test-utils/supabase.js';

const tcgData = {
  id: '00000000-0000-0000-0000-000000000010',
  name: 'MTG',
  slug: 'mtg',
  description: null,
  logo_path: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
};

describe('TCG routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/tcgs', () => {
    it('returns a list of TCGs', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const c = chain({ order: vi.fn().mockResolvedValue({ data: [tcgData], error: null }) });
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(c),
      });

      const res = await createTestApp('/api/tcgs', tcgRouter).request('/api/tcgs', {}, env);
      const body = (await res.json()) as { data: Array<{ name: string }> };
      expect(body.data[0].name).toBe('MTG');
    });
  });

  describe('POST /api/tcgs', () => {
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

      const res = await createTestApp('/api/tcgs', tcgRouter).request(
        '/api/tcgs',
        { method: 'POST' },
        env,
      );
      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not admin', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue(authMock(testUserId2));

      const res = await createTestApp('/api/tcgs', tcgRouter).request(
        '/api/tcgs',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test', slug: 'test' }),
        },
        env,
      );
      expect(res.status).toBe(403);
    });

    it('creates a TCG when admin is authenticated', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const adminId = '00000000-0000-0000-0000-00000000000a';
      const userC = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: adminId,
            email: 'a@b.com',
            username: 'a',
            role: 'admin',
            banned_at: null,
            deleted_at: null,
          },
          error: null,
        }),
      });
      const tcgC = chain({
        single: vi.fn().mockResolvedValue({ data: tcgData, error: null }),
        insert: vi.fn().mockReturnThis(),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(adminId),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userC;
          if (t === 'tcgs') return tcgC;
          return chain();
        }),
      });

      const res = await createTestApp('/api/tcgs', tcgRouter).request(
        '/api/tcgs',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'MTG', slug: 'mtg' }),
        },
        env,
      );
      expect(res.status).toBe(201);
    });
  });

  describe('DELETE /api/tcgs/:id', () => {
    it('soft-deletes a TCG', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const adminId = '00000000-0000-0000-0000-00000000000a';
      const userC = chain({
        single: vi.fn().mockResolvedValue({
          data: { id: adminId, role: 'admin', banned_at: null, deleted_at: null },
          error: null,
        }),
      });
      const tcgC = chain({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'tcg-1' }, error: null }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(adminId),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userC;
          if (t === 'tcgs') return tcgC;
          return chain();
        }),
      });

      const res = await createTestApp('/api/tcgs', tcgRouter).request(
        '/api/tcgs/tcg-1',
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer t' },
        },
        env,
      );
      expect(res.status).toBe(200);
    });
  });
});
