import { ref } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export function useEvent() {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);

  async function list(params?: Record<string, string>) {
    loading.value = true;
    try {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      const r = await fetch(`${apiUrl}/api/events${qs}`);
      const j = await r.json();
      items.value = j.data ?? [];
    } finally { loading.value = false; }
  }

  async function get(id: string) {
    const r = await fetch(`${apiUrl}/api/events/${id}`);
    return (await r.json()).data;
  }

  async function create(input: Record<string, unknown>) {
    const r = await fetch(`${apiUrl}/api/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    return (await r.json()).data;
  }

  async function join(id: string) {
    const r = await fetch(`${apiUrl}/api/events/${id}/join`, { method: 'POST' });
    return (await r.json()).data;
  }

  async function confirm(id: string) {
    const r = await fetch(`${apiUrl}/api/events/${id}/confirm`, { method: 'POST' });
    return (await r.json()).data;
  }

  async function decline(id: string) {
    const r = await fetch(`${apiUrl}/api/events/${id}/decline`, { method: 'POST' });
    return (await r.json()).data;
  }

  return { items, loading, list, get, create, join, confirm, decline };
}
