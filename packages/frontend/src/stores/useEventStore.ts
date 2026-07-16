import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiGet, apiPost } from '@/composables/useApi';
import type { Event } from '@/types/domain';

export const useEventStore = defineStore('events', () => {
  const items = ref<Event[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const current = ref<Event | null>(null);
  const nextCursor = ref<string | null>(null);
  const hasMore = computed(() => nextCursor.value !== null);

  async function list(params?: Record<string, string>) {
    loading.value = true;
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const j = await apiGet('/api/events' + query);
      items.value = (j.data ?? []) as Event[];
      nextCursor.value = (j.meta?.next_cursor as string | null) ?? null;
    } finally {
      loading.value = false;
    }
  }

  async function loadMore(params?: Record<string, string>) {
    if (!nextCursor.value || loadingMore.value) return;
    loadingMore.value = true;
    try {
      const searchParams = new URLSearchParams(params);
      searchParams.set('cursor', nextCursor.value);
      const j = await apiGet('/api/events?' + searchParams.toString());
      const page = (j.data ?? []) as Event[];
      items.value.push(...page);
      nextCursor.value = (j.meta?.next_cursor as string | null) ?? null;
    } finally {
      loadingMore.value = false;
    }
  }

  function reset() {
    items.value = [];
    nextCursor.value = null;
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

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    current,
    nextCursor,
    list,
    loadMore,
    reset,
    get,
    create,
    join,
    confirm,
    decline,
  };
});
