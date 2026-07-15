import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('fetch', vi.fn());

const mockNotifications = [
  {
    id: '1',
    user_id: 'u1',
    type: 'match_invite',
    title: 'Match Invite',
    body: 'You are invited!',
    data: { path: '/matches/1' },
    read_at: null,
    created_at: '2026-07-15T10:00:00Z',
  },
  {
    id: '2',
    user_id: 'u1',
    type: 'bracket_advance',
    title: 'You advanced!',
    body: 'Next round awaits',
    data: { path: '/tournaments/1' },
    read_at: '2026-07-15T11:00:00Z',
    created_at: '2026-07-15T09:00:00Z',
  },
];

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches notifications list', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: mockNotifications }),
    });

    const { useNotifications } = await import('../useNotifications');
    const { notifications, loading, fetchNotifications } = useNotifications();

    expect(loading.value).toBe(false);
    await fetchNotifications();
    expect(notifications.value).toHaveLength(2);
    expect(notifications.value[0]?.title).toBe('Match Invite');
    expect(loading.value).toBe(false);
  });

  it('handles empty notifications list', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    const { useNotifications } = await import('../useNotifications');
    const { notifications, fetchNotifications } = useNotifications();

    await fetchNotifications();
    expect(notifications.value).toHaveLength(0);
  });

  it('fetches unread count', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { unread_count: 3 } }),
    });

    const { useNotifications } = await import('../useNotifications');
    const { unreadCount, fetchUnreadCount } = useNotifications();

    expect(unreadCount.value).toBe(0);
    await fetchUnreadCount();
    expect(unreadCount.value).toBe(3);
  });

  it('marks a notification as read', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi
        .fn()
        .mockResolvedValue({ data: { ...mockNotifications[0]!, read_at: '2026-07-15T12:00:00Z' } }),
    });

    const { useNotifications } = await import('../useNotifications');
    const { markAsRead } = useNotifications();

    await markAsRead('1');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/1/read'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('marks all notifications as read', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { success: true } }),
    });

    const { useNotifications } = await import('../useNotifications');
    const { unreadCount, markAllAsRead } = useNotifications();

    await markAllAsRead();
    expect(unreadCount.value).toBe(0);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/read-all'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
