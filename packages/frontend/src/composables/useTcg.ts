import { ref } from 'vue';
import { getClient } from '@/composables/useApi';

export function useTcg() {
  const items = ref<Array<{ id: string; name: string; slug: string }>>([]);
  const loading = ref(false);

  async function list() {
    loading.value = true;
    try {
      const res = await getClient().api.tcgs.$get();
      const json = await res.json();
      items.value = json.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function create(input: { name: string; slug: string }) {
    await getClient().api.tcgs.$post({ json: input });
    await list();
  }

  async function remove(id: string) {
    await getClient().api.tcgs[':id'].$delete({ param: { id } });
    await list();
  }

  return { items, loading, list, create, remove };
}
