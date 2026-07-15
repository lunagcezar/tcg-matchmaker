import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

const mockEventStore = vi.hoisted(() => ({
  items: [],
  loading: false,
  current: {
    id: '1',
    type: 'tournament' as const,
    status: 'open' as const,
    name: 'Test Tournament',
    scheduled_at: '2026-08-01T10:00:00Z',
  },
  list: vi.fn(),
  get: vi.fn().mockResolvedValue({}),
  join: vi.fn(),
  confirm: vi.fn(),
  decline: vi.fn(),
}));

const mockStoreStore = vi.hoisted(() => ({
  items: [],
  loading: false,
  current: {
    id: '1',
    name: 'Test Store',
    city: 'Fortaleza',
    status: 'active',
    is_verified: true,
    address: 'Rua A',
    state: 'CE',
  },
  list: vi.fn(),
  get: vi.fn().mockResolvedValue({}),
  getMembers: vi.fn().mockResolvedValue([]),
  update: vi.fn(),
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/stores/useStoreStore', () => ({ useStoreStore: vi.fn(() => mockStoreStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@/composables/useApi', () => ({ apiGet: vi.fn().mockResolvedValue({ data: null }) }));
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { id: '1' } })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      event: {
        tournament: 'Tournament',
        trading: 'Trading',
        details: 'Details',
        participants: 'Participants',
        scheduledAt: 'Date & Time',
        status: 'Status',
      },
      tournament: {
        details: 'Tournament Details',
        bracket: 'Bracket',
        participants: 'Participants',
      },
      store: { details: 'Store Details', members: 'Members', verified: 'Verified', name: 'Name' },
      common: { noResults: 'No results' },
    },
  },
});

describe('TradingDetailPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders trading detail', async () => {
    const TradingDetailPage = (await import('../trading/DetailPage.vue')).default;
    const wrapper = shallowMount(TradingDetailPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-card-actions': { template: '<div><slot /></div>' },
          'q-badge': { template: '<span><slot /></span>' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-list': { template: '<div><slot /></div>' },
          'q-item': { template: '<div><slot /></div>' },
          'q-item-section': { template: '<div><slot /></div>' },
          'q-spinner': { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});

describe('TournamentDetailPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders tournament detail', async () => {
    const TournamentDetailPage = (await import('../tournaments/DetailPage.vue')).default;
    const wrapper = shallowMount(TournamentDetailPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-card-actions': { template: '<div><slot /></div>' },
          'q-badge': { template: '<span><slot /></span>' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-list': { template: '<div><slot /></div>' },
          'q-item': { template: '<div><slot /></div>' },
          'q-item-section': { template: '<div><slot /></div>' },
          'q-spinner': { template: '<div />' },
          'q-separator': { template: '<hr />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});

describe('StoreDetailPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders store detail', async () => {
    const StoreDetailPage = (await import('../stores/DetailPage.vue')).default;
    const wrapper = shallowMount(StoreDetailPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-badge': { template: '<span><slot /></span>' },
          'q-list': { template: '<div><slot /></div>' },
          'q-item': { template: '<div><slot /></div>' },
          'q-item-section': { template: '<div><slot /></div>' },
          'q-spinner': { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});

describe('StoreSettingsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders store settings', async () => {
    const StoreSettingsPage = (await import('../stores/SettingsPage.vue')).default;
    const wrapper = shallowMount(StoreSettingsPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-input': { template: '<input />' },
          'q-btn': { template: '<button><slot /></button>' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});

describe('NotificationPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders notifications', async () => {
    const NotificationPage = (await import('../notifications/NotificationPage.vue')).default;
    const mockNotificationStore = {
      notifications: [],
      unreadCount: 0,
      loading: false,
      fetchNotifications: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    };
    const wrapper = shallowMount(NotificationPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-list': { template: '<div><slot /></div>' },
          'q-item': { template: '<div><slot /></div>' },
          'q-item-section': { template: '<div><slot /></div>' },
          'q-icon': { template: '<div />' },
          'q-badge': { template: '<span><slot /></span>' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-spinner': { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
