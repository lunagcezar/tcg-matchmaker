import { shallowMount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n } from 'vue-i18n';

const mockEventStore = vi.hoisted(() => ({
  items: [],
  loading: false,
  current: {
    id: '1',
    type: 'match' as const,
    status: 'open' as const,
    scheduled_at: '2026-07-20T10:00:00Z',
    max_participants: 2,
    name: undefined as string | undefined,
  },
  list: vi.fn(),
  get: vi.fn().mockResolvedValue({}),
  join: vi.fn().mockResolvedValue({}),
  confirm: vi.fn().mockResolvedValue({}),
  decline: vi.fn().mockResolvedValue({}),
}));

const mockAuthStore = vi.hoisted(() => ({
  user: { id: 'u1' },
  restoreSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { id: '1' } })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: vi.fn(() => mockAuthStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@/composables/useApi', () => ({ apiGet: vi.fn().mockResolvedValue({ data: [] }) }));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      event: {
        matchDetails: 'Match Details',
        date: 'Date',
        players: 'Players',
        join: 'Join',
        confirm: 'Confirm',
        decline: 'Decline',
        confirmed: 'Confirmed',
        participants: 'Participants',
      },
    },
  },
});

describe('MatchDetailPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders match details', async () => {
    const MatchDetailPage = (await import('../matches/DetailPage.vue')).default;
    const wrapper = shallowMount(MatchDetailPage, {
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

  it('calls store.get on mount', async () => {
    const MatchDetailPage = (await import('../matches/DetailPage.vue')).default;
    shallowMount(MatchDetailPage, {
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
    expect(mockEventStore.get).toHaveBeenCalledWith('1');
  });

  it('uses the match name as the header title when present', async () => {
    mockEventStore.current = { ...mockEventStore.current, name: 'Test Match' };
    const MatchDetailPage = (await import('../matches/DetailPage.vue')).default;
    const wrapper = shallowMount(MatchDetailPage, {
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
          AppDetailLayout: { template: '<div><slot /></div>' },
          EventHeaderCard: {
            template: '<h1 class="header-title">{{ title }}</h1>',
            props: ['title'],
          },
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.header-title').text()).toBe('Test Match');
  });
});
