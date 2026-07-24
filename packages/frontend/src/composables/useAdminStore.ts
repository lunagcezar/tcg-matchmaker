import { apiGet, apiPost, apiPatch, apiDelete } from '@/composables/useApi';

export type AdminApiResult = Record<string, unknown>;

export async function fetchStore(id: string): Promise<AdminApiResult | null> {
  try {
    const json = (await apiGet(`/api/stores/${id}`)) as { data: AdminApiResult | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function verifyStore(id: string): Promise<AdminApiResult | null> {
  try {
    const json = (await apiPost(`/api/stores/${id}/verify`)) as {
      data: AdminApiResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function suspendStore(id: string, reason: string): Promise<AdminApiResult | null> {
  try {
    const json = (await apiPost(`/api/stores/${id}/suspend`, { reason })) as {
      data: AdminApiResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function deleteStore(id: string): Promise<AdminApiResult | null> {
  try {
    const json = (await apiDelete(`/api/stores/${id}`)) as {
      data: AdminApiResult | null;
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
): Promise<AdminApiResult | null> {
  try {
    const json = (await apiPatch(`/api/stores/${id}`, data)) as {
      data: AdminApiResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}
