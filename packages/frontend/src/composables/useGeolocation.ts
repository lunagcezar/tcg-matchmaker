import { ref } from 'vue';
import { useGeolocation as useVueuseGeolocation } from '@vueuse/core';
import { getClient } from '@/composables/useApi';

export function useGeolocation() {
  const { coords, resume, pause, isSupported } = useVueuseGeolocation();
  const suggestions = ref<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const searching = ref(false);

  async function search(query: string) {
    if (!query.trim()) {
      suggestions.value = [];
      return;
    }
    searching.value = true;
    try {
      const r = await getClient().api.geocode.search.$get({ query: { q: query } });
      const j = await r.json();
      suggestions.value = j.data ?? [];
    } finally {
      searching.value = false;
    }
  }

  return {
    coords,
    isSupported,
    resume,
    pause,
    suggestions,
    searching,
    search,
  };
}
