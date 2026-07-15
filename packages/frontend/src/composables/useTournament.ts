import { ref } from 'vue';
import { getClient } from '@/composables/useApi';

export function useTournament() {
  const items = ref<Array<Record<string, unknown>>>([]);
  const loading = ref(false);

  async function list() {
    loading.value = true;
    try {
      const r = await getClient().api.tournaments.$get();
      const j = await r.json();
      items.value = j.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    const r = await getClient().api.tournaments[':id'].$get({ param: { id } });
    return (await r.json()).data;
  }

  async function create(input: Record<string, unknown>) {
    const r = await getClient().api.tournaments.$post({ json: input });
    return (await r.json()).data;
  }

  async function register(id: string) {
    const r = await getClient().api.tournaments[':id'].register.$post({ param: { id } });
    return (await r.json()).data;
  }

  async function publish(id: string) {
    const r = await getClient().api.tournaments[':id'].publish.$post({ param: { id } });
    return (await r.json()).data;
  }

  async function start(id: string) {
    const r = await getClient().api.tournaments[':id'].start.$post({ param: { id } });
    return (await r.json()).data;
  }

  async function getBracket(id: string) {
    const r = await getClient().api.tournaments[':id'].bracket.$get({ param: { id } });
    return (await r.json()).data;
  }

  return { items, loading, list, get, create, register, publish, start, getBracket };
}
