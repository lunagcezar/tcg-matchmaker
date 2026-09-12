import { defineStore } from 'pinia';

import { apiGet } from '@/composables/useApi';
import { useCrudResource } from '@/composables/useCrudResource';
import type { Store, StoreMembership } from '@/types/domain';

export const useStoreStore = defineStore('stores', () => {
  const base = useCrudResource<Store>({ endpoint: '/api/stores' });

  async function getMembers(storeId: string) {
    const j = await apiGet(`/api/stores/${storeId}/members`);
    return (j.data ?? []) as StoreMembership[];
  }

  return { ...base, getMembers };
});
