import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useEventStore } from '../useEventStore';

vi.stubGlobal('fetch', vi.fn());

describe('useEventStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetches events list', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: [{ id: '1', type: 'match' }] }),
    });

    const store = useEventStore();
    await store.list();
    expect(store.items).toHaveLength(1);
  });

  it('handles empty event list', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    const store = useEventStore();
    await store.list();
    expect(store.items).toHaveLength(0);
    expect(store.loading).toBe(false);
  });

  it('paginates with loadMore', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [{ id: '1', type: 'match' }],
          meta: { next_cursor: 'c1' },
        }),
      })
      .mockResolvedValueOnce({
        json: vi
          .fn()
          .mockResolvedValue({ data: [{ id: '2', type: 'trading' }], meta: { next_cursor: null } }),
      });

    const store = useEventStore();
    await store.list();
    expect(store.items).toHaveLength(1);
    expect(store.nextCursor).toBe('c1');

    await store.loadMore();
    expect(store.items).toHaveLength(2);
    expect(store.nextCursor).toBeNull();
    expect(store.hasMore).toBe(false);
  });

  it('joins an event', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { id: '1', status: 'pending' } }),
    });

    const store = useEventStore();
    const result = await store.join('1');
    expect(result.status).toBe('pending');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/events/1/join'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('confirms attendance', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { id: '1', status: 'confirmed' } }),
    });

    const store = useEventStore();
    const result = await store.confirm('1');
    expect(result.status).toBe('confirmed');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/events/1/confirm'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('declines attendance', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { id: '1', status: 'declined' } }),
    });

    const store = useEventStore();
    const result = await store.decline('1');
    expect(result.status).toBe('declined');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/events/1/decline'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
