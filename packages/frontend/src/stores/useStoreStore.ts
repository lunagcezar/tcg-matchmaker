import { defineStore } from 'pinia';
import { ref } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const useStoreStore = defineStore('stores', () => {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);
  const current = ref<Record<string, unknown> | null>(null);

  async function list() {
    loading.value = true;
    try {
      const r = await fetch(`${apiUrl}/api/stores`);
      const j = await r.json();
      items.value = j.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const r = await fetch(`${apiUrl}/api/stores/${id}`);
    current.value = (await r.json()).data;
    return current.value;
  }

  async function create(input: Record<string, unknown>) {
    const r = await fetch(`${apiUrl}/api/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await r.json()).data;
    await list();
    return data;
  }

  return { items, loading, current, list, get, create };
});
