import { ACCOUNT_BANNED_MESSAGE, ACCOUNT_DELETED_MESSAGE } from '@/lib/authMessages';
import { supabase } from '@/lib/supabase';

const BASE_URL = import.meta.env.QCLI_API_URL || 'http://localhost:8787';

type ApiEnvelope = {
  data: unknown;
  error: string | null;
  meta: Record<string, unknown> | null;
};

let onSessionRejected: ((message: string) => void) | null = null;

export function setSessionRejectedHandler(handler: ((message: string) => void) | null): void {
  onSessionRejected = handler;
}

async function parseResponse(res: Response): Promise<ApiEnvelope> {
  const body = (await res.json()) as ApiEnvelope;
  if (body.error === ACCOUNT_BANNED_MESSAGE || body.error === ACCOUNT_DELETED_MESSAGE) {
    onSessionRejected?.(body.error);
  }
  return body;
}

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
  return parseResponse(res);
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
  return parseResponse(res);
}

export async function apiPatch(path: string, body: unknown) {
  const headers = await authHeaders();
  headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function apiDelete(path: string) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
  return parseResponse(res);
}
