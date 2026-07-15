import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiGet, apiPost, apiPatch } from '@/composables/useApi';
import type { Store, StoreMembership } from '@/types/domain';

export const useStoreStore = defineStore('stores', () => {
  const items = ref<Store[]>([]);
  const loading = ref(false);
  const current = ref<Store | null>(null);

  async function list() {
    loading.value = true;
    try {
      const j = await apiGet('/api/stores');
      items.value = (j.data ?? []) as Store[];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const j = await apiGet(`/api/stores/${id}`);
    current.value = j.data as Store | null;
    return current.value;
  }

  async function create(input: Record<string, unknown>) {
    const j = await apiPost('/api/stores', input);
    const data = j.data;
    await list();
    return data;
  }

  async function update(id: string, input: Record<string, unknown>) {
    const j = await apiPatch(`/api/stores/${id}`, input);
    const data = j.data;
    await list();
    return data;
  }

  async function getMembers(storeId: string) {
    const j = await apiGet(`/api/stores/${storeId}/members`);
    return (j.data ?? []) as StoreMembership[];
  }

  return { items, loading, current, list, get, create, update, getMembers };
});
