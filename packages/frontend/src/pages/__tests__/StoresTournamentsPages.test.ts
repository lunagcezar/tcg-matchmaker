import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

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
}));

const mockStoreStore = vi.hoisted(() => ({
  items: [{ id: '1', name: 'Test Store', city: 'Fortaleza', status: 'active', is_verified: true }],
  loading: false,
  list: vi.fn(),
  get: vi.fn(),
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/stores/useStoreStore', () => ({ useStoreStore: vi.fn(() => mockStoreStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: {
        tournaments: 'Tournaments',
        newTournament: 'New Tournament',
        stores: 'Stores',
        newStore: 'Add Store',
      },
      tournament: { details: 'Details', bracket: 'Bracket' },
      store: { name: 'Name', details: 'Details' },
      common: { noResults: 'No results' },
    },
  },
});

describe('TournamentListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders tournament list', async () => {
    const TournamentListPage = (await import('../tournaments/ListPage.vue')).default;
    const wrapper = shallowMount(TournamentListPage, {
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
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-badge': { template: '<span><slot /></span>' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-input': { template: '<input />' },
          'q-space': { template: '<div />' },
          'q-spinner': { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
    expect(mockStoreStore.list).toHaveBeenCalled();
  });
});
