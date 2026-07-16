const BASE_URL = import.meta.env.QCLI_API_URL || 'http://localhost:8787';

export async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  return res.json() as unknown as { data: unknown; error: string | null; meta: null };
}

export async function apiPost(path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    ...(body !== undefined
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  });
  return res.json() as unknown as { data: unknown; error: string | null; meta: null };
}

export async function apiPatch(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json() as unknown as { data: unknown; error: string | null; meta: null };
}

export async function apiDelete(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  return res.json() as unknown as { data: unknown; error: string | null; meta: null };
}
