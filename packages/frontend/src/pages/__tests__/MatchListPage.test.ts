import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';

const mockEventStore = vi.hoisted(() => ({
  items: [
    {
      id: '1',
      type: 'match' as const,
      status: 'open' as const,
      name: 'Test Match',
      tcg_name: 'MTG',
      scheduled_at: '2026-07-20T10:00:00Z',
    },
    {
      id: '2',
      type: 'match' as const,
      status: 'completed' as const,
      name: 'Past Match',
      tcg_name: 'Pokémon',
      scheduled_at: '2026-07-10T10:00:00Z',
    },
  ],
  loading: false,
  current: null,
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  join: vi.fn(),
  confirm: vi.fn(),
  decline: vi.fn(),
}));

vi.mock('@/stores/useEventStore', () => ({
  useEventStore: vi.fn(() => mockEventStore),
}));

vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: { matches: 'Matches', newMatch: 'New Match' },
      event: {
        anyTcg: 'Any TCG',
        all: 'All',
        open: 'Open',
        confirmed: 'Confirmed',
        completed: 'Completed',
      },
      common: { noResults: 'No results' },
    },
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/matches', name: 'matches', component: {} as never }],
});

describe('MatchListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders match list', async () => {
    const MatchListPage = (await import('../matches/ListPage.vue')).default;
    const wrapper = shallowMount(MatchListPage, {
      global: {
        plugins: [i18n, router, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-btn-toggle': { template: '<div />' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-badge': { template: '<span><slot /></span>' },
          'q-space': { template: '<div />' },
          'q-spinner': { template: '<div />' },
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(mockEventStore.list).toHaveBeenCalledWith({ type: 'match' });
  });

  it('filters matches by status', async () => {
    const MatchListPage = (await import('../matches/ListPage.vue')).default;
    const wrapper = shallowMount(MatchListPage, {
      global: {
        plugins: [i18n, router, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-btn-toggle': { template: '<div />' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-badge': { template: '<span><slot /></span>' },
          'q-space': { template: '<div />' },
          'q-spinner': { template: '<div />' },
        },
      },
    });

    const vm = wrapper.vm as unknown as { statusFilter: string };
    expect(vm.statusFilter).toBe('');
  });
});
