import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useNotificationStore } from '../useNotificationStore';

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

describe('useNotificationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetches notifications list', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: mockNotifications }),
    });

    const store = useNotificationStore();
    expect(store.loading).toBe(false);
    await store.fetchNotifications();
    expect(store.notifications).toHaveLength(2);
    expect(store.notifications[0]?.title).toBe('Match Invite');
    expect(store.loading).toBe(false);
  });

  it('handles empty notifications list', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    const store = useNotificationStore();
    await store.fetchNotifications();
    expect(store.notifications).toHaveLength(0);
  });

  it('fetches unread count', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { unread_count: 3 } }),
    });

    const store = useNotificationStore();
    expect(store.unreadCount).toBe(0);
    await store.fetchUnreadCount();
    expect(store.unreadCount).toBe(3);
  });

  it('marks a notification as read', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi
        .fn()
        .mockResolvedValue({ data: { ...mockNotifications[0]!, read_at: '2026-07-15T12:00:00Z' } }),
    });

    const store = useNotificationStore();
    await store.markAsRead('1');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/1/read'),
      expect.anything(),
    );
  });

  it('marks all notifications as read', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { success: true } }),
    });

    const store = useNotificationStore();
    await store.markAllAsRead();
    expect(store.unreadCount).toBe(0);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/read-all'),
      expect.anything(),
    );
  });
});
