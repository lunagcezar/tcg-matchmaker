import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getApiBase } from '@/lib/api';

const apiUrl = getApiBase();

export const useEventStore = defineStore('events', () => {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);
  const current = ref<Record<string, unknown> | null>(null);

  async function list(params?: Record<string, string>) {
    loading.value = true;
    try {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      const r = await fetch(`${apiUrl}/api/events${qs}`);
      const j = await r.json();
      items.value = j.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const r = await fetch(`${apiUrl}/api/events/${id}`);
    current.value = (await r.json()).data;
    return current.value;
  }

  async function create(input: Record<string, unknown>) {
    const r = await fetch(`${apiUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await r.json()).data;
    return data;
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

  return { items, loading, current, list, get, create, join, confirm, decline };
});
