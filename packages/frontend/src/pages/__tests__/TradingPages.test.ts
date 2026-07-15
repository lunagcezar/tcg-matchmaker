import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

const mockEventStore = vi.hoisted(() => ({
  items: [
    {
      id: '1',
      type: 'trading' as const,
      status: 'active' as const,
      name: 'Trade Session',
      scheduled_at: '2026-07-21T10:00:00Z',
      tcg_name: 'MTG',
    },
    {
      id: '2',
      type: 'trading' as const,
      status: 'planned' as const,
      name: 'Upcoming Trade',
      scheduled_at: '2026-07-25T10:00:00Z',
    },
  ],
  loading: false,
  current: {
    id: '1',
    type: 'trading' as const,
    status: 'active' as const,
    name: 'Trade Session',
    scheduled_at: '2026-07-21T10:00:00Z',
  },
  list: vi.fn(),
  get: vi.fn().mockResolvedValue({}),
  join: vi.fn(),
  confirm: vi.fn(),
  decline: vi.fn(),
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@/composables/useApi', () => ({ apiGet: vi.fn().mockResolvedValue({ data: [] }) }));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: { trading: 'Trading', newTrading: 'New Session' },
      event: {
        trading: 'Trading',
        anyTcg: 'Any TCG',
        rsvp: 'RSVP',
        confirm: 'Confirm',
        decline: 'Decline',
        tradingDetails: 'Details',
        participants: 'Participants',
      },
      common: { noResults: 'No results' },
    },
  },
});

describe('TradingListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders trading list', async () => {
    const TradingListPage = (await import('../trading/ListPage.vue')).default;
    const wrapper = shallowMount(TradingListPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-badge': { template: '<span><slot /></span>' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-space': { template: '<div />' },
          'q-spinner': { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
    expect(mockEventStore.list).toHaveBeenCalledWith({ type: 'trading' });
  });
});
