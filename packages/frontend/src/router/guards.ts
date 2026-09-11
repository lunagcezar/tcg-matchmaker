import { ROLES } from '@tcg/shared';
import type { NavigationGuard } from 'vue-router';

import { apiGet } from '@/composables/useApi';
import { useAuthStore } from '@/stores/useAuthStore';

export const routerGuard: NavigationGuard = async (to) => {
  if (to.meta?.requiresOnboarding) return;

  if (to.name !== 'onboarding' && to.name !== 'login' && to.name !== 'signup') {
    const auth = useAuthStore();
    if (!auth.user) {
      const needsOnboarding = await auth.checkOnboarding();
      if (needsOnboarding) return { name: 'onboarding' };
    }
  }

  if (to.meta?.requiresAuth) {
    const auth = useAuthStore();
    if (!auth.user) return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta?.requiresAdmin) {
    const auth = useAuthStore();
    if (!auth.user) return { name: 'login' };
    const j = await apiGet('/api/auth/me');
    const profile = j.data as Record<string, unknown> | null;
    if (profile?.role !== ROLES[2]) return { name: 'home' };
  }

  return;
};
