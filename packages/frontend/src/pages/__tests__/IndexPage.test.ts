import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

const mockEventStore = vi.hoisted(() => ({
  items: [],
  loading: false,
  current: null,
  list: vi.fn(),
  get: vi.fn(),
  reset: vi.fn(),
  loadMore: vi.fn(),
  hasMore: false,
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      home: { noEvents: 'No events nearby', findNearMe: 'Find near me' },
      event: { all: 'All' },
      nav: { matches: 'Matches', trading: 'Trading', tournaments: 'Tournaments' },
    },
  },
});

function stubs() {
  return {
    MapListLayout: {
      template: '<div><slot name="map" /><slot name="filters" /><slot name="items" /></div>',
    },
    EventMap: { template: '<div class="event-map-stub" />' },
    'q-infinite-scroll': { template: '<div><slot /></div>' },
    'q-btn': { template: '<button><slot /></button>' },
    'q-badge': { template: '<span><slot /></span>' },
    'q-spinner': { template: '<span>loading</span>' },
    'q-space': { template: '<span />' },
    'router-link': { template: '<a><slot /></a>' },
  };
}

describe('IndexPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the home page', async () => {
    const IndexPage = (await import('../IndexPage.vue')).default;
    const wrapper = shallowMount(IndexPage, {
      global: { plugins: [i18n, createPinia()], stubs: stubs() },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('loads events on mount', async () => {
    const IndexPage = (await import('../IndexPage.vue')).default;
    shallowMount(IndexPage, {
      global: { plugins: [i18n, createPinia()], stubs: stubs() },
    });
    expect(mockEventStore.list).toHaveBeenCalled();
  });

  it('renders map and filter tabs', async () => {
    const IndexPage = (await import('../IndexPage.vue')).default;
    const wrapper = shallowMount(IndexPage, {
      global: { plugins: [i18n, createPinia()], stubs: stubs() },
    });
    expect(wrapper.find('.event-map-stub').exists()).toBe(true);
    expect(wrapper.find('.filter-segment').exists()).toBe(true);
  });
});
