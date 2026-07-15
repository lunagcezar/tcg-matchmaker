import { ref } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export function useTcg() {
  const items = ref<Array<{ id: string; name: string; slug: string }>>([]);
  const loading = ref(false);

  async function list() {
    loading.value = true;
    try {
      const res = await fetch(`${apiUrl}/api/tcgs`);
      const json = await res.json();
      items.value = json.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function create(input: { name: string; slug: string }) {
    await fetch(`${apiUrl}/api/tcgs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    await list();
  }

  async function remove(id: string) {
    await fetch(`${apiUrl}/api/tcgs/${id}`, { method: 'DELETE' });
    await list();
  }

  return { items, loading, list, create, remove };
}
