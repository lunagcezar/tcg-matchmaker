import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('fetch', vi.fn());

describe('useAdminStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches store by id', async () => {
    const mockStore = { id: '1', name: 'Test Store', status: 'active', is_verified: false };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: mockStore }),
    });

    const { fetchStore } = await import('../useAdminStore');
    const store = await fetchStore('1');

    expect(store?.name).toBe('Test Store');
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/stores/1'));
  });

  it('verifies a store', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { success: true } }),
    });

    const { verifyStore } = await import('../useAdminStore');
    const result = await verifyStore('1');

    expect(result).toEqual({ success: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stores/1/verify'),
      expect.anything(),
    );
  });

  it('suspends a store with reason', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { success: true } }),
    });

    const { suspendStore } = await import('../useAdminStore');
    const result = await suspendStore('1', 'Inappropriate content');

    expect(result).toEqual({ success: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stores/1/suspend'),
      expect.anything(),
    );
  });

  it('soft-deletes a store', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { success: true } }),
    });

    const { deleteStore } = await import('../useAdminStore');
    const result = await deleteStore('1');

    expect(result).toEqual({ success: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stores/1'),
      expect.anything(),
    );
  });

  it('handles fetch error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: null, error: 'Store not found' }),
    });

    const { fetchStore } = await import('../useAdminStore');
    const store = await fetchStore('999');

    expect(store).toBeNull();
  });
});
