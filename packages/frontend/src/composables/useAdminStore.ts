const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

interface ApiResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export async function fetchStore(id: string): Promise<ApiResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stores/${id}`);
    const json = await res.json() as { data: ApiResult | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function verifyStore(id: string): Promise<ApiResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stores/${id}/verify`, { method: 'POST' });
    const json = await res.json() as { data: ApiResult | null; error: string | null };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function suspendStore(id: string, reason: string): Promise<ApiResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stores/${id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json() as { data: ApiResult | null; error: string | null };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function deleteStore(id: string): Promise<ApiResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stores/${id}`, { method: 'DELETE' });
    const json = await res.json() as { data: ApiResult | null; error: string | null };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function updateStore(id: string, data: Record<string, unknown>): Promise<ApiResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json() as { data: ApiResult | null; error: string | null };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}
