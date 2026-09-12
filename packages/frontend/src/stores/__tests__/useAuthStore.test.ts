import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ACCOUNT_BANNED_MESSAGE, ACCOUNT_DELETED_MESSAGE } from '@/lib/authMessages';

import { useAuthStore } from '../useAuthStore';

vi.stubGlobal('fetch', vi.fn());

const supabaseMock = vi.hoisted(() => ({
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
  },
}));

vi.mock('@/lib/supabase', () => ({ supabase: supabaseMock }));

function mockFetchJson(data: unknown, error: string | null) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    json: vi.fn().mockResolvedValue({ data, error, meta: null }),
  });
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } });
  });

  describe('checkOnboarding', () => {
    it('returns true when no admin exists (hasAdmin: false) and caches result', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ data: { hasAdmin: false } }),
      });

      const store = useAuthStore();
      const result = await store.checkOnboarding();

      expect(result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(store.onboardingRequired).toBe(true);

      const result2 = await store.checkOnboarding();
      expect(result2).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns false when admin exists (hasAdmin: true) and caches result', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ data: { hasAdmin: true } }),
      });

      const store = useAuthStore();
      const result = await store.checkOnboarding();

      expect(result).toBe(false);
      expect(store.onboardingRequired).toBe(false);
    });

    it('returns false on fetch error and caches result', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      const store = useAuthStore();
      const result = await store.checkOnboarding();

      expect(result).toBe(false);
      expect(store.onboardingRequired).toBe(false);
    });
  });

  describe('signIn', () => {
    it('rejects a banned account, signs out, and clears state', async () => {
      supabaseMock.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'banned@test.com' } },
        error: null,
      });
      mockFetchJson(null, ACCOUNT_BANNED_MESSAGE);

      const store = useAuthStore();
      await expect(store.signIn('banned@test.com', 'password123')).rejects.toThrow(
        ACCOUNT_BANNED_MESSAGE,
      );

      expect(supabaseMock.auth.signOut).toHaveBeenCalled();
      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
    });

    it('rejects a deleted account, signs out, and clears state', async () => {
      supabaseMock.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'gone@test.com' } },
        error: null,
      });
      mockFetchJson(null, ACCOUNT_DELETED_MESSAGE);

      const store = useAuthStore();
      await expect(store.signIn('gone@test.com', 'password123')).rejects.toThrow(
        ACCOUNT_DELETED_MESSAGE,
      );

      expect(supabaseMock.auth.signOut).toHaveBeenCalled();
      expect(store.user).toBeNull();
    });

    it('signs in a valid account and loads the profile', async () => {
      supabaseMock.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'luna@test.com' } },
        error: null,
      });
      mockFetchJson({ id: 'u1', email: 'luna@test.com', username: 'luna', role: 'user' }, null);

      const store = useAuthStore();
      await store.signIn('luna@test.com', 'password123');

      expect(store.user?.id).toBe('u1');
      expect(store.profile?.username).toBe('luna');
      expect(supabaseMock.auth.signOut).not.toHaveBeenCalled();
    });

    it('keeps the session when the profile fetch fails transiently', async () => {
      supabaseMock.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'luna@test.com' } },
        error: null,
      });
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));

      const store = useAuthStore();
      await store.signIn('luna@test.com', 'password123');

      expect(store.user?.id).toBe('u1');
      expect(store.profile).toBeNull();
      expect(supabaseMock.auth.signOut).not.toHaveBeenCalled();
    });
  });

  describe('restoreSession', () => {
    it('signs out a banned account with a persisted session', async () => {
      supabaseMock.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u1', email: 'banned@test.com' } } },
        error: null,
      });
      mockFetchJson(null, ACCOUNT_BANNED_MESSAGE);

      const store = useAuthStore();
      await store.restoreSession();

      expect(supabaseMock.auth.signOut).toHaveBeenCalled();
      expect(store.user).toBeNull();
    });

    it('restores a valid persisted session', async () => {
      supabaseMock.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u1', email: 'luna@test.com' } } },
        error: null,
      });
      mockFetchJson({ id: 'u1', email: 'luna@test.com', username: 'luna', role: 'user' }, null);

      const store = useAuthStore();
      await store.restoreSession();

      expect(store.user?.id).toBe('u1');
      expect(store.profile?.username).toBe('luna');
      expect(supabaseMock.auth.signOut).not.toHaveBeenCalled();
    });
  });

  describe('handleRejectedSession', () => {
    it('signs out and clears user and profile', async () => {
      const store = useAuthStore();
      store.user = { id: 'u1', email: 'banned@test.com' } as never;
      store.profile = { id: 'u1', username: 'luna' } as never;

      await store.handleRejectedSession();

      expect(supabaseMock.auth.signOut).toHaveBeenCalled();
      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
    });
  });
});
