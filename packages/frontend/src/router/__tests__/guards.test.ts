import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RouteLocationNormalized } from 'vue-router';

const mockAuthStore = vi.hoisted(() => ({
  user: null as unknown,
  checkOnboarding: vi.fn<() => Promise<boolean>>(),
}));

const mockApi = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

vi.mock('@/composables/useApi', () => ({
  apiGet: mockApi.apiGet,
}));

import { ROLES } from '@tcg/shared';

import { routerGuard } from '../guards';

function makeTo(
  overrides: { name?: unknown; fullPath?: string; meta?: Record<string, unknown> } = {},
): RouteLocationNormalized {
  return {
    name: overrides.name ?? 'home',
    fullPath: overrides.fullPath ?? '/',
    meta: overrides.meta ?? {},
  } as RouteLocationNormalized;
}

const from = {} as RouteLocationNormalized;

describe('routerGuard', () => {
  beforeEach(() => {
    mockAuthStore.user = null;
    mockAuthStore.checkOnboarding.mockReset();
    mockAuthStore.checkOnboarding.mockResolvedValue(false);
    mockApi.apiGet.mockReset();
  });

  it('allows routes marked requiresOnboarding without touching the auth store', async () => {
    const result = await routerGuard(
      makeTo({ name: 'onboarding', meta: { requiresOnboarding: true } }),
      from,
    );
    expect(result).toBeUndefined();
    expect(mockAuthStore.checkOnboarding).not.toHaveBeenCalled();
  });

  it('redirects to onboarding when a logged-out user still needs onboarding', async () => {
    mockAuthStore.checkOnboarding.mockResolvedValue(true);
    const result = await routerGuard(makeTo({ name: 'matches' }), from);
    expect(result).toEqual({ name: 'onboarding' });
  });

  it('allows navigation when a logged-out user does not need onboarding', async () => {
    const result = await routerGuard(makeTo({ name: 'matches' }), from);
    expect(result).toBeUndefined();
  });

  it('skips the onboarding check on login, signup, and onboarding routes', async () => {
    const result = await routerGuard(makeTo({ name: 'login' }), from);
    expect(result).toBeUndefined();
    expect(mockAuthStore.checkOnboarding).not.toHaveBeenCalled();
  });

  it('redirects to login with the original path when requiresAuth and logged out', async () => {
    const result = await routerGuard(
      makeTo({ name: 'settings', fullPath: '/settings', meta: { requiresAuth: true } }),
      from,
    );
    expect(result).toEqual({ name: 'login', query: { redirect: '/settings' } });
  });

  it('allows requiresAuth routes when logged in', async () => {
    mockAuthStore.user = { id: 'u1' };
    const result = await routerGuard(
      makeTo({ name: 'settings', meta: { requiresAuth: true } }),
      from,
    );
    expect(result).toBeUndefined();
  });

  it('redirects to login when requiresAdmin and logged out', async () => {
    const result = await routerGuard(
      makeTo({ name: 'admin', meta: { requiresAdmin: true } }),
      from,
    );
    expect(result).toEqual({ name: 'login' });
  });

  it('allows admin routes when the user role is admin', async () => {
    mockAuthStore.user = { id: 'u1' };
    mockApi.apiGet.mockResolvedValue({ data: { role: ROLES[2] } });
    const result = await routerGuard(
      makeTo({ name: 'admin', meta: { requiresAdmin: true } }),
      from,
    );
    expect(result).toBeUndefined();
    expect(mockApi.apiGet).toHaveBeenCalledWith('/api/auth/me');
  });

  it('redirects to home when the user role is not admin', async () => {
    mockAuthStore.user = { id: 'u1' };
    mockApi.apiGet.mockResolvedValue({ data: { role: ROLES[0] } });
    const result = await routerGuard(
      makeTo({ name: 'admin', meta: { requiresAdmin: true } }),
      from,
    );
    expect(result).toEqual({ name: 'home' });
  });
});
