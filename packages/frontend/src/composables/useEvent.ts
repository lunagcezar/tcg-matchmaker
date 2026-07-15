import { ref } from 'vue';
import { getClient } from '@/composables/useApi';

export function useEvent() {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);

  async function list(params?: Record<string, string>) {
    loading.value = true;
    try {
      const r = await getClient().api.events.$get({ query: params as Record<string, string> });
      const j = await r.json();
      items.value = j.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const r = await getClient().api.events[':id'].$get({ param: { id } });
    return (await r.json()).data;
  }

  async function create(input: Record<string, unknown>) {
    const r = await getClient().api.events.$post({ json: input });
    return (await r.json()).data;
  }

  async function join(id: string) {
    const r = await getClient().api.events[':id'].join.$post({ param: { id } });
    return (await r.json()).data;
  }

  async function confirm(id: string) {
    const r = await getClient().api.events[':id'].confirm.$post({ param: { id } });
    return (await r.json()).data;
  }

  async function decline(id: string) {
    const r = await getClient().api.events[':id'].decline.$post({ param: { id } });
    return (await r.json()).data;
  }

  return { items, loading, list, get, create, join, confirm, decline };
}
