import { apiDelete, apiPost } from '@/composables/useApi';

interface ApiResult {
  success?: boolean;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export async function deleteAccount(): Promise<ApiResult> {
  try {
    const json = (await apiDelete('/api/auth/account')) as {
      data: ApiResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function suspendAccount(): Promise<ApiResult> {
  try {
    const json = (await apiPost('/api/auth/suspend')) as {
      data: ApiResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportData(): Promise<any> {
  try {
    const json = (await apiPost('/api/auth/export')) as { data: unknown; error: string | null };
    if (json.error) return null;
    return json.data;
  } catch {
    return null;
  }
}
