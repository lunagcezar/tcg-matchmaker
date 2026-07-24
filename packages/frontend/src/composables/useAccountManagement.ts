import { apiDelete, apiPost } from '@/composables/useApi';

export type AccountActionResult = {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
};

export async function deleteAccount(): Promise<AccountActionResult> {
  try {
    const json = (await apiDelete('/api/auth/account')) as {
      data: AccountActionResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function suspendAccount(): Promise<AccountActionResult> {
  try {
    const json = (await apiPost('/api/auth/suspend')) as {
      data: AccountActionResult | null;
      error: string | null;
    };
    if (json.error) return { error: json.error };
    return json.data ?? { success: true };
  } catch {
    return { error: 'Network error' };
  }
}

export async function exportData(): Promise<unknown> {
  try {
    const json = (await apiPost('/api/auth/export')) as { data: unknown; error: string | null };
    if (json.error) return null;
    return json.data;
  } catch {
    return null;
  }
}
