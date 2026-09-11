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
}));

vi.mock('@/stores/useEventStore', () => ({ useEventStore: vi.fn(() => mockEventStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@/composables/useApi', () => ({
  apiGet: vi.fn().mockResolvedValue({
    data: {
      username: 'testuser',
      role: 'player',
      created_at: '2026-01-01T00:00:00Z',
    },
  }),
}));
vi.mock('vue-router', () => ({ useRoute: vi.fn(() => ({ params: { username: 'testuser' } })) }));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      profile: {
        title: 'Profile',
        memberSince: 'Member since',
        eventHistory: 'Event History',
        noEvents: 'No events yet',
        role: 'Role',
      },
      common: { noResults: 'No results' },
    },
  },
});

describe('ProfilePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the profile page', async () => {
    const ProfilePage = (await import('../ProfilePage.vue')).default;
    const wrapper = shallowMount(ProfilePage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-list': { template: '<div><slot /></div>' },
          'q-item': { template: '<div><slot /></div>' },
          'q-item-section': { template: '<div><slot /></div>' },
          'q-avatar': { template: '<div />' },
          'q-icon': { template: '<div />' },
          'q-badge': { template: '<span><slot /></span>' },
          'q-spinner': { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
