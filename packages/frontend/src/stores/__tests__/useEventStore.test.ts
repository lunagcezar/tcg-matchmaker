import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEventStore } from '../useEventStore';

vi.stubGlobal('fetch', vi.fn());

const mockEvents = [
  { id: '1', type: 'match', name: 'Test Match', status: 'open' },
  { id: '2', type: 'trading', name: 'Test Trading', status: 'active' },
];

describe('useEventStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetches events list', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: mockEvents }),
    });

    const store = useEventStore();
    await store.list();

    expect(store.items).toHaveLength(2);
    expect(store.items[0]?.name).toBe('Test Match');
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
});
