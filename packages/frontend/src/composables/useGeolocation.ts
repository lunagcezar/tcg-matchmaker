import { ref } from 'vue';
import { useGeolocation as useVueuseGeolocation } from '@vueuse/core';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';

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
      const r = await fetch(`${apiUrl}/api/geocode/search?q=${encodeURIComponent(query)}`);
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
