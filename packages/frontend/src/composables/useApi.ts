import { supabase } from '@/lib/supabase';

const BASE_URL = import.meta.env.QCLI_API_URL || 'http://localhost:8787';

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  }
  return headers;
}

export async function apiGet(path: string) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  return res.json() as unknown as {
    data: unknown;
    error: string | null;
    meta: Record<string, unknown> | null;
  };
}

export async function apiPost(path: string, body?: unknown) {
  const headers = await authHeaders();
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return res.json() as unknown as {
    data: unknown;
    error: string | null;
    meta: Record<string, unknown> | null;
  };
}

export async function apiPatch(path: string, body: unknown) {
  const headers = await authHeaders();
  headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return res.json() as unknown as {
    data: unknown;
    error: string | null;
    meta: Record<string, unknown> | null;
  };
}

export async function apiDelete(path: string) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
  return res.json() as unknown as {
    data: unknown;
    error: string | null;
    meta: Record<string, unknown> | null;
  };
}
