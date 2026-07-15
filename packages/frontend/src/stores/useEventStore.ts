import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getClient } from '@/composables/useApi';

export const useEventStore = defineStore('events', () => {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);
  const current = ref<Record<string, unknown> | null>(null);

  async function list(params?: Record<string, string>) {
    loading.value = true;
    try {
      const r = await getClient().api.events.$get({ query: params });
      const j = await r.json();
      items.value = j.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const r = await getClient().api.events[':id'].$get({ param: { id } });
    current.value = (await r.json()).data;
    return current.value;
  }

  async function create(input: Record<string, unknown>) {
    const r = await getClient().api.events.$post({ json: input });
    const data = (await r.json()).data;
    return data;
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

  return { items, loading, current, list, get, create, join, confirm, decline };
});
