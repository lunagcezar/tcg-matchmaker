import { shallowMount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n } from 'vue-i18n';

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
  fallbackLocale: 'en-US',
  messages: {
    'en-US': {
      event: {
        createMatch: 'Create Match',
        createTrading: 'Create Trading Session',
        createTournament: 'Create Tournament',
        name: 'Name',
        scheduledAt: 'Date & Time',
        maxParticipants: 'Max Participants',
        location: 'Location',
        details: 'Details',
        defaultParticipantHint: 'Default: {default}',
      },
      tournament: {
        create: 'Create Tournament',
        bracketType: 'Bracket Type',
        bestOf: 'Best Of',
        bracketOptions: {
          single_elimination: 'Single Elimination',
          double_elimination: 'Double Elimination',
          round_robin: 'Round Robin',
          swiss: 'Swiss',
          pool_play: 'Pool Play',
        },
        bestOfOptions: {
          1: 'BO1',
          3: 'BO3',
          5: 'BO5',
        },
      },
      store: {
        create: 'Add Store',
        name: 'Name',
        address: 'Address',
        latitude: 'Latitude',
        longitude: 'Longitude',
        searchLocation: 'Search location',
        city: 'City',
        state: 'State',
        phone: 'Phone',
      },
      common: { save: 'Save', loading: 'Loading...' },
    },
  },
});

function commonStubs() {
  return {
    'q-page': { template: '<div><slot /></div>' },
    'q-card': { template: '<div><slot /></div>' },
    'q-card-section': { template: '<div><slot /></div>' },
    'q-form': { template: '<form><slot /></form>', methods: { validate: () => true } },
    'q-input': { template: '<input />' },
    'q-btn': { template: '<button><slot /></button>' },
    'q-select': { template: '<div class="q-select" />', props: ['options', 'modelValue'] },
    'q-option-group': { template: '<div />' },
    DateTimePicker: { template: '<div class="date-time-picker" />' },
    LocationAutocomplete: { template: '<div />' },
    AppCard: { template: '<div><slot /></div>' },
  };
}

describe('CreatePages', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders match create page', async () => {
    const Page = (await import('../matches/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders a required Name field as the first input on the match create page', async () => {
    const Page = (await import('../matches/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs[0].attributes('label')).toBe('Name');
  });

  it('includes the name in the match create payload', async () => {
    const Page = (await import('../matches/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });

    const vm = wrapper.vm as unknown as { form: { name: string }; save: () => Promise<void> };
    vm.form.name = 'Sunday Night FNM';
    await vm.save();

    expect(mockEventStore.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Sunday Night FNM', type: 'match' }),
    );
  });

  it('renders trading create page', async () => {
    const Page = (await import('../trading/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders tournament create page', async () => {
    const Page = (await import('../tournaments/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders store create page', async () => {
    const Page = (await import('../stores/CreatePage.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
