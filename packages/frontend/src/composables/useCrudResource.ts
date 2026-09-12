import { ref, computed, type Ref } from 'vue';

import { apiGet, apiPatch, apiPost } from '@/composables/useApi';

export interface CrudResourceOptions {
  endpoint: string;
  limit?: number;
}

export interface CrudResource<T> {
  items: Ref<T[]>;
  loading: Ref<boolean>;
  loadingMore: Ref<boolean>;
  hasMore: Ref<boolean>;
  nextCursor: Ref<string | null>;
  current: Ref<T | null>;
  list: (params?: Record<string, string>) => Promise<void>;
  loadMore: () => Promise<void>;
  get: (id: string) => Promise<T | null>;
  create: (input: Record<string, unknown>) => Promise<unknown>;
  update: (id: string, input: Record<string, unknown>) => Promise<unknown>;
  reset: () => void;
}

export function useCrudResource<T>(options: CrudResourceOptions): CrudResource<T> {
  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const loadingMore = ref(false);
  const current = ref<T | null>(null) as Ref<T | null>;
  const nextCursor = ref<string | null>(null);
  const hasMore = computed(() => nextCursor.value !== null);

  const limit = options.limit ?? 20;
  let lastParams: Record<string, string> = {};

  async function fetchPage(params: Record<string, string>) {
    const search = new URLSearchParams(params);
    search.set('limit', String(limit));
    if (nextCursor.value) search.set('cursor', nextCursor.value);
    const j = await apiGet(`${options.endpoint}?${search.toString()}`);
    const page = (j.data ?? []) as T[];
    items.value.push(...page);
    nextCursor.value = (j.meta?.next_cursor as string | null) ?? null;
  }

  async function list(params?: Record<string, string>) {
    lastParams = params ?? {};
    items.value = [];
    nextCursor.value = null;
    loading.value = true;
    try {
      await fetchPage(lastParams);
    } finally {
      loading.value = false;
    }
  }

  async function loadMore() {
    if (!nextCursor.value || loadingMore.value) return;
    loadingMore.value = true;
    try {
      await fetchPage(lastParams);
    } finally {
      loadingMore.value = false;
    }
  }

  async function get(id: string): Promise<T | null> {
    const j = await apiGet(`${options.endpoint}/${id}`);
    current.value = j.data as T | null;
    return current.value;
  }

  async function create(input: Record<string, unknown>): Promise<unknown> {
    const j = await apiPost(options.endpoint, input);
    if (j.error) throw new Error(j.error as string);
    return j.data;
  }

  async function update(id: string, input: Record<string, unknown>): Promise<unknown> {
    const j = await apiPatch(`${options.endpoint}/${id}`, input);
    return j.data;
  }

  function reset() {
    items.value = [];
    nextCursor.value = null;
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
    reset,
  };
}
