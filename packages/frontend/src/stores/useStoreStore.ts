import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiGet, apiPost, apiPatch } from '@/composables/useApi';
import type { Store, StoreMembership } from '@/types/domain';

export const useStoreStore = defineStore('stores', () => {
  const items = ref<Store[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const hasMore = ref(true);
  const nextCursor = ref<string | null>(null);
  const current = ref<Store | null>(null);

  async function list() {
    loading.value = true;
    items.value = [];
    nextCursor.value = null;
    hasMore.value = true;
    try {
      await loadMore();
    } finally {
      loading.value = false;
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return;
    loadingMore.value = true;
    try {
      let url = '/api/stores?limit=20';
      if (nextCursor.value) url += `&cursor=${nextCursor.value}`;
      const j = await apiGet(url);
      const page = (j.data ?? []) as Store[];
      const meta = j.meta as { next_cursor: string | null; has_more: boolean } | undefined;
      items.value.push(...page);
      nextCursor.value = meta?.next_cursor ?? null;
      hasMore.value = meta?.has_more ?? false;
    } finally {
      loadingMore.value = false;
    }
  }

  async function get(id: string) {
    const j = await apiGet(`/api/stores/${id}`);
    current.value = j.data as Store | null;
    return current.value;
  }

  async function create(input: Record<string, unknown>) {
    const j = await apiPost('/api/stores', input);
    if (j.error) throw new Error(j.error as string);
    return j.data;
  }

  async function update(id: string, input: Record<string, unknown>) {
    const j = await apiPatch(`/api/stores/${id}`, input);
    return j.data;
  }

  async function getMembers(storeId: string) {
    const j = await apiGet(`/api/stores/${storeId}/members`);
    return (j.data ?? []) as StoreMembership[];
  }

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    nextCursor,
    current,
    list,
    loadMore,
    get,
    create,
    update,
    getMembers,
  };
});
