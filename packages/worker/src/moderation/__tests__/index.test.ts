import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { reportRouter, adminRouter } from '../index.js';
import {
  env,
  testUserId,
  testUserId2,
  chain,
  makeApp,
  userChain,
  authMock,
} from '../../test-utils/supabase.js';

const reportId = '00000000-0000-0000-0000-000000000100';
const targetUserId = testUserId2;

describe('Moderation routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/reports', () => {
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
        .route('/api/reports', reportRouter)
        .request('/api/reports', { method: 'POST' }, env);
      expect(res.status).toBe(401);
    });

    it('creates a report', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const rChain = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: reportId,
            reporter_id: testUserId,
            target_type: 'user',
            target_id: targetUserId,
            reason: 'Abusive behavior',
            status: 'pending',
            admin_notes: null,
            created_at: '2026-07-14T00:00:00.000Z',
            resolved_at: null,
          },
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return userChain();
          if (t === 'reports') return rChain;
          return chain();
        }),
      });

      const res = await makeApp()
        .route('/api/reports', reportRouter)
        .request(
          '/api/reports',
          {
            method: 'POST',
            headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_type: 'user',
              target_id: targetUserId,
              reason: 'Abusive behavior',
            }),
          },
          env,
        );
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/reports', () => {
    it('returns 403 for non-admin', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      (createClient as ReturnType<typeof vi.fn>).mockReturnValue(authMock(testUserId));

      const res = await makeApp()
        .route('/api/reports', reportRouter)
        .request(
          '/api/reports',
          {
            headers: { Authorization: 'Bearer t' },
          },
          env,
        );
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/users/:id/ban', () => {
    it('bans a user', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const adminId = '00000000-0000-0000-0000-00000000000a';
      const adminUChain = chain({
        single: vi.fn().mockResolvedValue({
          data: {
            id: adminId,
            email: 'a@b.com',
            username: 'admin',
            role: 'admin',
            banned_at: null,
            deleted_at: null,
          },
          error: null,
        }),
      });
      const targetChain = chain({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: targetUserId }, error: null }),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(adminId),
        from: vi.fn().mockImplementation((t: string) => {
          if (t === 'users') return adminUChain;
          return targetChain;
        }),
      });

      const res = await makeApp()
        .route('/api/admin', adminRouter)
        .request(
          `/api/admin/users/${targetUserId}/ban`,
          {
            method: 'POST',
            headers: { Authorization: 'Bearer t' },
          },
          env,
        );
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/admin/users/:id/promote', () => {
    it('promotes a user to admin', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const adminId = '00000000-0000-0000-0000-00000000000a';
      const promoteSingle = vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            id: adminId,
            email: 'a@b.com',
            username: 'admin',
            role: 'admin',
            banned_at: null,
            deleted_at: null,
          },
          error: null,
        })
        .mockResolvedValue({ data: { id: targetUserId, role: 'player' }, error: null });
      const chainCalls = chain({
        single: promoteSingle,
        update: vi.fn().mockReturnThis(),
      });

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
        ...authMock(adminId),
        from: vi.fn().mockImplementation((_t: string) => chainCalls),
      });

      const res = await makeApp()
        .route('/api/admin', adminRouter)
        .request(
          `/api/admin/users/${targetUserId}/promote`,
          {
            method: 'POST',
            headers: { Authorization: 'Bearer t' },
          },
          env,
        );
      expect(res.status).toBe(200);
    });
  });
});
