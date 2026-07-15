import { ref } from 'vue';
import { getApiBase } from '@/lib/api';

const apiUrl = getApiBase();

export function useTournament() {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);

  async function list() {
    loading.value = true;
    try {
      const r = await fetch(`${apiUrl}/api/tournaments`);
      const j = await r.json();
      items.value = j.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const r = await fetch(`${apiUrl}/api/tournaments/${id}`);
    return (await r.json()).data;
  }

  async function create(input: Record<string, unknown>) {
    const r = await fetch(`${apiUrl}/api/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return (await r.json()).data;
  }

  async function register(id: string) {
    const r = await fetch(`${apiUrl}/api/tournaments/${id}/register`, { method: 'POST' });
    return (await r.json()).data;
  }

  async function publish(id: string) {
    const r = await fetch(`${apiUrl}/api/tournaments/${id}/publish`, { method: 'POST' });
    return (await r.json()).data;
  }

  async function start(id: string) {
    const r = await fetch(`${apiUrl}/api/tournaments/${id}/start`, { method: 'POST' });
    return (await r.json()).data;
  }

  async function getBracket(id: string) {
    const r = await fetch(`${apiUrl}/api/tournaments/${id}/bracket`);
    return (await r.json()).data;
  }

  return { items, loading, list, get, create, register, publish, start, getBracket };
}
