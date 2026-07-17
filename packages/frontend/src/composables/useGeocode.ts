import { ref } from 'vue';
import { apiGet } from '@/composables/useApi';

export interface GeocodeAddress {
  city?: string;
  state?: string;
  country?: string;
  road?: string;
  house_number?: string;
  town?: string;
  village?: string;
  municipality?: string;
}

export interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: GeocodeAddress;
}

export function useGeocode() {
  const results = ref<GeocodeResult[]>([]);
  const loading = ref(false);

  async function search(query: string) {
    if (!query || query.length < 3) {
      results.value = [];
      return;
    }
    loading.value = true;
    try {
      const res = await apiGet(`/api/geocode/search?q=${encodeURIComponent(query)}`);
      results.value = (res.data as GeocodeResult[]) || [];
    } catch {
      results.value = [];
    } finally {
      loading.value = false;
    }
  }

  return { results, loading, search };
}
