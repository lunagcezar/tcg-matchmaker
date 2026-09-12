import { getCurrentInstance, onMounted, ref, type Ref } from 'vue';

export interface Loadable<T> {
  data: Ref<T>;
  loading: Ref<boolean>;
  load: () => Promise<void>;
}

export function useLoadable<T>(fetcher: () => Promise<T>, initial: T): Loadable<T> {
  const data = ref<T>(initial) as Ref<T>;
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      data.value = await fetcher();
    } finally {
      loading.value = false;
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => void load());
  }

  return { data, loading, load };
}
