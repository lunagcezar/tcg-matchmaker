const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

interface ApiResult {
  success?: boolean;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export async function deleteAccount(): Promise<ApiResult> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/account`, { method: 'DELETE' });
    const json = await res.json() as { data: ApiResult | null; error: string | null };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function suspendAccount(): Promise<ApiResult> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/suspend`, { method: 'POST' });
    const json = await res.json() as { data: ApiResult | null; error: string | null };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportData(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/export`, { method: 'POST' });
    const json = await res.json() as { data: unknown; error: string | null };
    if (json.error) return null;
    return json.data;
  } catch {
    return null;
  }
}
