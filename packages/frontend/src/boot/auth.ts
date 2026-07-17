import { defineBoot } from '#q-app';
import { useAuthStore } from '@/stores/useAuthStore';

export default defineBoot(async () => {
  const authStore = useAuthStore();
  await authStore.restoreSession();
});
