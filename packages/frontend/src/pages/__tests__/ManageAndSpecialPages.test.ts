import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

const mockEventStore = vi.hoisted(() => ({
  items: [],
  loading: false,
  current: { id: '1', type: 'tournament' as const, status: 'in_progress' as const },
  list: vi.fn(),
  get: vi.fn().mockResolvedValue({}),
  create: vi.fn(),
  join: vi.fn(),
  confirm: vi.fn(),
  decline: vi.fn(),
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@/composables/useApi', () => ({
  apiGet: vi.fn().mockResolvedValue({ data: null }),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { id: '1' } })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));
vi.mock('quasar', () => ({
  useQuasar: vi.fn(() => ({ dialog: vi.fn(() => ({ onOk: vi.fn() })), notify: vi.fn() })),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      tournament: {
        manage: 'Manage',
        publish: 'Publish',
        start: 'Start',
        checkIn: 'Check In',
        walkover: 'Walkover',
        report: 'Report Result',
        participants: 'Participants',
        bracket: 'Bracket',
      },
      event: { participants: 'Participants' },
      common: { noResults: 'No results', back: 'Back' },
    },
  },
});

describe('TournamentManagePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders manage page', async () => {
    const Page = (await import('../tournaments/ManagePage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-badge': { template: '<span><slot /></span>' },
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

describe('ErrorNotFound', () => {
  it('renders error page', async () => {
    const Page = (await import('../ErrorNotFound.vue')).default;
    const wrapper = shallowMount(Page, {
      global: { stubs: { 'q-page': { template: '<div><slot /></div>' } } },
    });
    expect(wrapper.exists()).toBe(true);
  });
});

describe('SecondPage', () => {
  it('renders second page', async () => {
    const Page = (await import('../SecondPage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: { stubs: { 'q-page': { template: '<div><slot /></div>' } } },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
