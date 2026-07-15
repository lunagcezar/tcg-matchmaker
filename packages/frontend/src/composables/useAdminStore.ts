import { apiGet, apiPost, apiPatch, apiDelete } from '@/composables/useApi';

interface ApiResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export async function fetchStore(id: string): Promise<ApiResult | null> {
  try {
    const json = (await apiGet(`/api/stores/${id}`)) as { data: ApiResult | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function verifyStore(id: string): Promise<ApiResult | null> {
  try {
    const json = (await apiPost(`/api/stores/${id}/verify`)) as {
      data: ApiResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function suspendStore(id: string, reason: string): Promise<ApiResult | null> {
  try {
    const json = (await apiPost(`/api/stores/${id}/suspend`, { reason })) as {
      data: ApiResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function deleteStore(id: string): Promise<ApiResult | null> {
  try {
    const json = (await apiDelete(`/api/stores/${id}`)) as {
      data: ApiResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function updateStore(
  id: string,
  data: Record<string, unknown>,
): Promise<ApiResult | null> {
  try {
    const json = (await apiPatch(`/api/stores/${id}`, data)) as {
      data: ApiResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}
