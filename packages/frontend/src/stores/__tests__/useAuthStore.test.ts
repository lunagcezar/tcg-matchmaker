import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAuthStore } from '../useAuthStore';

vi.stubGlobal('fetch', vi.fn());

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
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
});
