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
  create: vi.fn().mockResolvedValue({ id: 'new-1' }),
  join: vi.fn(),
  confirm: vi.fn(),
  decline: vi.fn(),
}));

const mockStoreStore = vi.hoisted(() => ({
  items: [],
  loading: false,
  current: null,
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn().mockResolvedValue({ id: 'new-1' }),
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/stores/useStoreStore', () => ({ useStoreStore: vi.fn(() => mockStoreStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      event: {
        createMatch: 'Create Match',
        createTrading: 'Create Trading Session',
        createTournament: 'Create Tournament',
        scheduledAt: 'Date & Time',
        maxParticipants: 'Max Participants',
      },
      store: {
        create: 'Add Store',
        name: 'Name',
        address: 'Address',
        latitude: 'Latitude',
        longitude: 'Longitude',
      },
      common: { save: 'Save', loading: 'Loading...' },
    },
  },
});

describe('CreatePages', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders match create page', async () => {
    const Page = (await import('../matches/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
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

  it('renders trading create page', async () => {
    const Page = (await import('../trading/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-input': { template: '<input />' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-select': { template: '<select />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders tournament create page', async () => {
    const Page = (await import('../tournaments/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-input': { template: '<input />' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-select': { template: '<select />' },
          'q-option-group': { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders store create page', async () => {
    const Page = (await import('../stores/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
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
