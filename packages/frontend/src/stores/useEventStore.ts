import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiGet, apiPost } from '@/composables/useApi';
import type { Event } from '@/types/domain';

export const useEventStore = defineStore('events', () => {
  const items = ref<Event[]>([]);
  const loading = ref(false);
  const current = ref<Event | null>(null);

  async function list(params?: Record<string, string>) {
    loading.value = true;
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const j = await apiGet('/api/events' + query);
      items.value = (j.data ?? []) as Event[];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const j = await apiGet(`/api/events/${id}`);
    current.value = j.data as Event | null;
    return current.value;
  }

  async function create(input: Record<string, unknown>) {
    const j = await apiPost('/api/events', input);
    return j.data;
  }

  async function join(id: string) {
    const j = await apiPost(`/api/events/${id}/join`);
    return j.data;
  }

  async function confirm(id: string) {
    const j = await apiPost(`/api/events/${id}/confirm`);
    return j.data;
  }

  async function decline(id: string) {
    const j = await apiPost(`/api/events/${id}/decline`);
    return j.data;
  }

  return { items, loading, current, list, get, create, join, confirm, decline };
});
