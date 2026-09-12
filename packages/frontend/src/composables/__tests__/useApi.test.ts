import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ACCOUNT_BANNED_MESSAGE, ACCOUNT_DELETED_MESSAGE } from '@/lib/authMessages';

import { apiGet, setSessionRejectedHandler } from '../useApi';

vi.stubGlobal('fetch', vi.fn());

describe('useApi session rejection hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setSessionRejectedHandler(null);
  });

  it('invokes the handler on a banned response and still returns the envelope', async () => {
    const handler = vi.fn();
    setSessionRejectedHandler(handler);
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: null, error: ACCOUNT_BANNED_MESSAGE, meta: null }),
    });

    const res = await apiGet('/api/events');

    expect(res.error).toBe(ACCOUNT_BANNED_MESSAGE);
    expect(handler).toHaveBeenCalledWith(ACCOUNT_BANNED_MESSAGE);
  });

  it('invokes the handler on a deleted-account response', async () => {
    const handler = vi.fn();
    setSessionRejectedHandler(handler);
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: null, error: ACCOUNT_DELETED_MESSAGE, meta: null }),
    });

    await apiGet('/api/auth/me');

    expect(handler).toHaveBeenCalledWith(ACCOUNT_DELETED_MESSAGE);
  });

  it('does not invoke the handler for unrelated errors', async () => {
    const handler = vi.fn();
    setSessionRejectedHandler(handler);
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: null, error: 'Store not found', meta: null }),
    });

    await apiGet('/api/stores/1');

    expect(handler).not.toHaveBeenCalled();
  });

  it('is a no-op when no handler is registered', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: null, error: ACCOUNT_BANNED_MESSAGE, meta: null }),
    });

    const res = await apiGet('/api/events');

    expect(res.error).toBe(ACCOUNT_BANNED_MESSAGE);
  });
});
