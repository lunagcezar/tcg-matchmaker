import { shallowMount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n } from 'vue-i18n';

const mockEventStore = vi.hoisted(() => ({
  items: [
    {
      id: '1',
      type: 'tournament' as const,
      status: 'open' as const,
      name: 'Test Tournament',
      scheduled_at: '2026-08-01T10:00:00Z',
      bracket_type: 'single_elimination',
    },
  ],
  loading: false,
  list: vi.fn(),
  get: vi.fn(),
  loadMore: vi.fn(),
  hasMore: false,
}));

const mockStoreStore = vi.hoisted(() => ({
  items: [{ id: '1', name: 'Test Store', city: 'Fortaleza', status: 'active', is_verified: true }],
  loading: false,
  list: vi.fn(),
  get: vi.fn(),
  loadMore: vi.fn(),
  hasMore: false,
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/stores/useStoreStore', () => ({ useStoreStore: vi.fn(() => mockStoreStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': {
      nav: {
        tournaments: 'Tournaments',
        newTournament: 'New Tournament',
        stores: 'Stores',
        newStore: 'Add Store',
      },
      home: { noEvents: 'No events nearby' },
      tournament: { details: 'Details', bracket: 'Bracket', createLabel: 'New Tournament' },
      store: { name: 'Name', details: 'Details', create: 'Add Store', verified: 'Verified' },
      common: { noResults: 'No results', search: 'Search' },
    },
  },
});

function stubs() {
  return {
    MapListLayout: {
      template: '<div><slot name="map" /><slot name="filters" /><slot name="items" /></div>',
    },
    EventMap: { template: '<div class="event-map-stub" />' },
    BaseList: { template: '<div><slot /><slot name="item" :item="{}" /></div>' },
    EventRow: { template: '<a class="event-row"><slot /></a>' },
    StatusBadge: { template: '<span class="status-badge"><slot /></span>' },
    'q-page': { template: '<div><slot /></div>' },
    'q-card': { template: '<div><slot /></div>' },
    'q-card-section': { template: '<div><slot /></div>' },
    'q-badge': { template: '<span><slot /></span>' },
    'q-btn': { template: '<button><slot /></button>' },
    'q-input': { template: '<input />' },
    'q-space': { template: '<div />' },
  };
}

describe('TournamentListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders tournament list', async () => {
    const TournamentListPage = (await import('../tournaments/ListPage.vue')).default;
    const wrapper = shallowMount(TournamentListPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
    expect(mockEventStore.list).toHaveBeenCalledWith({ type: 'tournament' });
  });
});

describe('StoresListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders stores list', async () => {
    const StoresListPage = (await import('../stores/ListPage.vue')).default;
    const wrapper = shallowMount(StoresListPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
    expect(mockStoreStore.list).toHaveBeenCalled();
  });
});
