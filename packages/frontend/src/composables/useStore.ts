import { ref } from 'vue';
import { getClient } from '@/composables/useApi';

export function useStore() {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);

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
    return (await r.json()).data;
  }

  async function create(input: Record<string, unknown>) {
    const r = await getClient().api.stores.$post({ json: input });
    await list();
    return (await r.json()).data;
  }

  async function update(id: string, input: Record<string, unknown>) {
    const r = await getClient().api.stores[':id'].$patch({ param: { id }, json: input });
    await list();
    return (await r.json()).data;
  }

  async function getMembers(storeId: string) {
    const r = await getClient().api.stores[':id'].members.$get({ param: { id: storeId } });
    return (await r.json()).data;
  }

  return { items, loading, list, get, create, update, getMembers };
}
