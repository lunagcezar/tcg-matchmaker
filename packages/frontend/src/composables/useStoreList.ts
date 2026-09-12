import { getCurrentInstance, onMounted } from 'vue';

export interface StoreListSource {
  hasMore: boolean;
  list: (params?: Record<string, string>) => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useStoreList(source: StoreListSource, params?: Record<string, string>) {
  function loadMore(_index: number, done: (stop?: boolean) => void) {
    void source.loadMore().then(() => done(!source.hasMore));
  }

  if (getCurrentInstance()) {
    onMounted(() => void source.list(params));
  }

  return { loadMore };
}
