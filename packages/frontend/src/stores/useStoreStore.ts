import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiGet, apiPost, apiPatch } from '@/composables/useApi';

export const useStoreStore = defineStore('stores', () => {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);
  const current = ref<Record<string, unknown> | null>(null);

  async function list() {
    loading.value = true;
    try {
      const j = await apiGet('/api/stores');
      items.value = (j.data ?? []) as Record<string, unknown>[];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const j = await apiGet(`/api/stores/${id}`);
    current.value = j.data as Record<string, unknown> | null;
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
    return (j.data ?? []) as Record<string, unknown>[];
  }

  return { items, loading, current, list, get, create, update, getMembers };
});
