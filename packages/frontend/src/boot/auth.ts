import { defineBoot } from '#q-app';
import { setSessionRejectedHandler } from '@/composables/useApi';
import { ACCOUNT_BANNED_MESSAGE } from '@/lib/authMessages';
import { useAuthStore } from '@/stores/useAuthStore';

export default defineBoot(async ({ router }) => {
  const authStore = useAuthStore();
  setSessionRejectedHandler((message) => {
    const reason = message === ACCOUNT_BANNED_MESSAGE ? 'banned' : 'deleted';
    void authStore.handleRejectedSession().then(() => {
      void router.push({ name: 'login', query: { reason } });
    });
  });
  await authStore.restoreSession();
});
