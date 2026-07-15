import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getClient } from '@/composables/useApi';

export const useStoreStore = defineStore('stores', () => {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);
  const current = ref<Record<string, unknown> | null>(null);

  async function list() {
    loading.value = true;
    try {
      const r = await getClient().api.stores.$get();
      const j = await r.json();
      items.value = j.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const r = await getClient().api.stores[':id'].$get({ param: { id } });
    current.value = (await r.json()).data;
    return current.value;
  }

  async function create(input: Record<string, unknown>) {
    const r = await getClient().api.stores.$post({ json: input });
    const data = (await r.json()).data;
    await list();
    return data;
  }

  return { items, loading, current, list, get, create };
});
