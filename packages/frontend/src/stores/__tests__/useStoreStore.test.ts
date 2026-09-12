import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useStoreStore } from '../useStoreStore';

vi.stubGlobal('fetch', vi.fn());

describe('useStoreStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetches stores list', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Duel Deck' }],
        error: null,
        meta: { next_cursor: null },
      }),
    });

    const store = useStoreStore();
    await store.list();
    expect(store.items).toHaveLength(1);
    expect(store.loading).toBe(false);
  });

  it('paginates with loadMore using next_cursor', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [{ id: '1', name: 'A' }],
          error: null,
          meta: { next_cursor: 'c1', has_more: true },
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [{ id: '2', name: 'B' }],
          error: null,
          meta: { next_cursor: null, has_more: false },
        }),
      });

    const store = useStoreStore();
    await store.list();
    expect(store.items).toHaveLength(1);
    expect(store.hasMore).toBe(true);

    await store.loadMore();
    expect(store.items).toHaveLength(2);
    expect(store.hasMore).toBe(false);
  });

  it('fetches a store by id and sets current', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        data: { id: '1', name: 'Duel Deck', viewer_role: 'manager' },
        error: null,
        meta: null,
      }),
    });

    const store = useStoreStore();
    const s = await store.get('1');
    expect(s?.name).toBe('Duel Deck');
    expect(store.current?.name).toBe('Duel Deck');
  });

  it('creates a store', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { id: '2', name: 'New' }, error: null, meta: null }),
    });

    const store = useStoreStore();
    const result = await store.create({ name: 'New' });
    expect((result as { id: string }).id).toBe('2');
  });

  it('updates a store', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi
        .fn()
        .mockResolvedValue({ data: { id: '1', name: 'Renamed' }, error: null, meta: null }),
    });

    const store = useStoreStore();
    const result = await store.update('1', { name: 'Renamed' });
    expect((result as { name: string }).name).toBe('Renamed');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stores/1'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('fetches store members', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        data: [{ user_id: 'u1', role: 'owner' }],
        error: null,
        meta: null,
      }),
    });

    const store = useStoreStore();
    const members = await store.getMembers('1');
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('owner');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stores/1/members'),
      expect.anything(),
    );
  });
});
