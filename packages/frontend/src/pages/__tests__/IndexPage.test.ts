import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

const mockEventStore = vi.hoisted(() => ({
  items: [
    {
      id: '1',
      type: 'match' as const,
      status: 'open' as const,
      name: 'Test Match',
      scheduled_at: '2026-07-20T10:00:00Z',
    },
    {
      id: '2',
      type: 'trading' as const,
      status: 'active' as const,
      name: 'Trade Session',
      scheduled_at: '2026-07-21T10:00:00Z',
    },
  ],
  loading: false,
  current: null,
  list: vi.fn(),
  get: vi.fn(),
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      home: {
        heading: 'Matches & Events Near You',
        findNearMe: 'Find near me',
        noEvents: 'No events nearby',
        map: 'Map',
        list: 'List',
        recentEvents: 'Recent Events',
      },
    },
  },
});

function stubs() {
  return {
    'q-page': { template: '<div><slot /></div>' },
    FilterBar: { template: '<div class="filter-bar-stub" />' },
    EventMap: { template: '<div class="event-map-stub" />' },
    EventFeed: { template: '<div class="event-feed-stub" />' },
    'q-btn': { template: '<button><slot /></button>' },
    'q-page-sticky': { template: '<div><slot /></div>' },
  };
}

describe('IndexPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the home page', async () => {
    const IndexPage = (await import('../IndexPage.vue')).default;
    const wrapper = shallowMount(IndexPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('loads events on mount', async () => {
    const IndexPage = (await import('../IndexPage.vue')).default;
    shallowMount(IndexPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    expect(mockEventStore.list).toHaveBeenCalled();
  });

  it('renders map above filter and feed', async () => {
    const IndexPage = (await import('../IndexPage.vue')).default;
    const wrapper = shallowMount(IndexPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    const sections = wrapper.findAll('section');
    expect(sections.length).toBe(2);
    expect(sections[0].find('.event-map-stub').exists()).toBe(true);
    expect(sections[1].find('.filter-bar-stub').exists()).toBe(true);
    expect(sections[1].find('.event-feed-stub').exists()).toBe(true);
  });
});
