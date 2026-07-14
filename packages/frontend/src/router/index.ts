import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to, _from, next) => {
    // Check onboarding redirect
    if (to.meta?.requiresOnboarding) {
      next();
      return;
    }

    // Auth guard
    if (to.meta?.requiresAuth) {
      const { useAuthStore } = await import('@/stores/useAuthStore');
      const auth = useAuthStore();
      if (!auth.user) {
        next({ name: 'login', query: { redirect: to.fullPath } });
        return;
      }
    }

    // Admin guard (simplified — full check would hit the API)
    if (to.meta?.requiresAdmin) {
      const { useAuthStore } = await import('@/stores/useAuthStore');
      const auth = useAuthStore();
      if (!auth.user) {
        next({ name: 'login' });
        return;
      }
    }

    next();
  });

  return Router;
});
