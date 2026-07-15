import { getClient } from '@/composables/useApi';

interface ApiResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export async function fetchStore(id: string): Promise<ApiResult | null> {
  try {
    const res = await getClient().api.stores[':id'].$get({ param: { id } });
    const json = (await res.json()) as { data: ApiResult | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function verifyStore(id: string): Promise<ApiResult | null> {
  try {
    const res = await getClient().api.stores[':id'].verify.$post({ param: { id } });
    const json = (await res.json()) as { data: ApiResult | null; error: string | null };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function suspendStore(id: string, reason: string): Promise<ApiResult | null> {
  try {
    const res = await getClient().api.stores[':id'].suspend.$post({
      param: { id },
      json: { reason },
    });
    const json = (await res.json()) as { data: ApiResult | null; error: string | null };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function deleteStore(id: string): Promise<ApiResult | null> {
  try {
    const res = await getClient().api.stores[':id'].$delete({ param: { id } });
    const json = (await res.json()) as { data: ApiResult | null; error: string | null };
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
    const res = await getClient().api.stores[':id'].$patch({
      param: { id },
      json: data,
    });
    const json = (await res.json()) as { data: ApiResult | null; error: string | null };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}
