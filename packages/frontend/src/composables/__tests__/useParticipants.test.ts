import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useParticipants } from '../useParticipants';

vi.stubGlobal('fetch', vi.fn());

function mockFetch(data: unknown) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: vi.fn().mockResolvedValue({ data, error: null, meta: null }),
  });
}

describe('useParticipants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('populates participants on success', async () => {
    mockFetch([{ id: 'p1', username: 'Luna', status: 'confirmed' }]);
    const { participants, loading, loadParticipants } = useParticipants('event-1');

    const pending = loadParticipants();
    expect(loading.value).toBe(true);
    await pending;

    expect(participants.value).toHaveLength(1);
    expect(participants.value[0].username).toBe('Luna');
    expect(loading.value).toBe(false);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/events/event-1/participants'),
      expect.anything(),
    );
  });

  it('keeps an empty list without throwing on failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));
    const { participants, loading, loadParticipants } = useParticipants('event-2');

    await expect(loadParticipants()).resolves.toBeUndefined();

    expect(participants.value).toEqual([]);
    expect(loading.value).toBe(false);
  });
});
