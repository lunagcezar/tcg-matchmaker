import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useCrudResource } from '../useCrudResource';

vi.stubGlobal('fetch', vi.fn());

function mockFetch(data: unknown, meta: Record<string, unknown> | null = null) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: vi.fn().mockResolvedValue({ data, error: null, meta }),
  });
}

function fetchCalls(): Array<{ url: string; options: { method?: string; body?: string } }> {
  return (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map((call) => ({
    url: call[0] as string,
    options: (call[1] ?? {}) as { method?: string; body?: string },
  }));
}

interface Row {
  id: string;
  name?: string;
}

describe('useCrudResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replaces items and records next_cursor on list', async () => {
    mockFetch([{ id: '1' }, { id: '2' }], { next_cursor: 'c1' });
    const r = useCrudResource<Row>({ endpoint: '/api/events' });

    await r.list();

    expect(r.items.value.map((i) => i.id)).toEqual(['1', '2']);
    expect(r.nextCursor.value).toBe('c1');
    expect(r.hasMore.value).toBe(true);
    expect(r.loading.value).toBe(false);
  });

  it('appends the next page on loadMore and stops at null cursor', async () => {
    mockFetch([{ id: '1' }], { next_cursor: 'c1' });
    const r = useCrudResource<Row>({ endpoint: '/api/events' });
    await r.list();

    mockFetch([{ id: '2' }], { next_cursor: null });
    await r.loadMore();

    expect(r.items.value.map((i) => i.id)).toEqual(['1', '2']);
    expect(r.nextCursor.value).toBeNull();
    expect(r.hasMore.value).toBe(false);
  });

  it('reuses the params passed to list when calling loadMore', async () => {
    mockFetch([{ id: '1' }], { next_cursor: 'c1' });
    const r = useCrudResource<Row>({ endpoint: '/api/events' });
    await r.list({ type: 'match' });

    mockFetch([{ id: '2' }], { next_cursor: null });
    await r.loadMore();

    const urls = fetchCalls().map((c) => c.url);
    expect(urls[0]).toContain('type=match');
    expect(urls[1]).toContain('type=match');
    expect(urls[1]).toContain('cursor=c1');
  });

  it('no-ops loadMore when there is no next cursor', async () => {
    mockFetch([{ id: '1' }], { next_cursor: null });
    const r = useCrudResource<Row>({ endpoint: '/api/events' });
    await r.list();

    await r.loadMore();

    expect(fetchCalls()).toHaveLength(1);
  });

  it('creates and returns data on success', async () => {
    mockFetch({ id: '1', status: 'pending' });
    const r = useCrudResource<Row>({ endpoint: '/api/events' });

    const result = await r.create({ type: 'match' });

    expect(result).toEqual({ id: '1', status: 'pending' });
    expect(fetchCalls()[0].options.method).toBe('POST');
  });

  it('throws when create returns an API error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ data: null, error: 'Forbidden', meta: null }),
    });
    const r = useCrudResource<Row>({ endpoint: '/api/events' });

    await expect(r.create({ type: 'match' })).rejects.toThrow('Forbidden');
  });

  it('gets a single item and sets current', async () => {
    mockFetch({ id: '7', name: 'Seven' });
    const r = useCrudResource<Row>({ endpoint: '/api/events' });

    const item = await r.get('7');

    expect(item).toEqual({ id: '7', name: 'Seven' });
    expect(r.current.value?.id).toBe('7');
  });

  it('updates an item via PATCH', async () => {
    mockFetch({ id: '7', name: 'Updated' });
    const r = useCrudResource<Row>({ endpoint: '/api/stores' });

    const result = await r.update('7', { name: 'Updated' });

    expect(result).toEqual({ id: '7', name: 'Updated' });
    expect(fetchCalls()[0].url).toContain('/api/stores/7');
    expect(fetchCalls()[0].options.method).toBe('PATCH');
  });

  it('resets items and cursor', async () => {
    mockFetch([{ id: '1' }], { next_cursor: 'c1' });
    const r = useCrudResource<Row>({ endpoint: '/api/events' });
    await r.list();

    r.reset();

    expect(r.items.value).toEqual([]);
    expect(r.nextCursor.value).toBeNull();
    expect(r.hasMore.value).toBe(false);
  });
});
