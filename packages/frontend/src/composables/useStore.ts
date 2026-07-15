import { ref } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export function useStore() {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);

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
    return (await r.json()).data;
  }

  async function create(input: Record<string, unknown>) {
    const r = await fetch(`${apiUrl}/api/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    await list();
    return (await r.json()).data;
  }

  async function update(id: string, input: Record<string, unknown>) {
    const r = await fetch(`${apiUrl}/api/stores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    await list();
    return (await r.json()).data;
  }

  async function getMembers(storeId: string) {
    const r = await fetch(`${apiUrl}/api/stores/${storeId}/members`);
    return (await r.json()).data;
  }

  return { items, loading, list, get, create, update, getMembers };
}
