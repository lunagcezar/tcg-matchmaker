import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

const mockRoutePath = ref('/');

const mockAuthStore = vi.hoisted(() => ({
  user: null,
  loading: false,
  restoreSession: vi.fn(),
  onboardingRequired: null,
  checkOnboarding: vi.fn(),
}));

const mockAppStore = vi.hoisted(() => ({
  darkMode: false,
  locale: 'en-US',
  setLocale: vi.fn(),
  toggleDarkMode: vi.fn(),
}));

const mockQuasar = vi.hoisted(() => ({
  dark: { set: vi.fn() },
}));

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ path: mockRoutePath.value })),
}));

vi.mock('quasar', () => ({
  useQuasar: vi.fn(() => mockQuasar),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn(() => mockAppStore),
}));

vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));

import { ref } from 'vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      app: { title: 'TCG Matchmaker' },
      nav: {
        matches: 'Matches',
        trading: 'Trading',
        tournaments: 'Tournaments',
        stores: 'Stores',
        home: 'Home',
      },
    },
  },
});

describe('MainLayout', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockRoutePath.value = '/';
  });

  it('renders app title', async () => {
    const MainLayout = (await import('../MainLayout.vue')).default;
    const wrapper = shallowMount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-layout': { template: '<div><slot /></div>' },
          'q-header': { template: '<header><slot /></header>' },
          'q-toolbar': { template: '<div><slot /></div>' },
          'q-toolbar-title': { template: '<span class="q-toolbar-title"><slot /></span>' },
          'q-btn': { template: '<button><slot /></button>' },
          ThemeLangSwitcher: { template: '<div />' },
          UserMenu: { template: '<div />' },
          NotificationBell: { template: '<div />' },
          'q-page-container': { template: '<main><slot /></main>' },
          'router-view': { template: '<div />' },
        },
      },
    });
    expect(wrapper.find('.q-toolbar-title').text()).toBe('TCG Matchmaker');
  });

  it('applies dark mode on mount', async () => {
    mockAppStore.darkMode = true;
    const MainLayout = (await import('../MainLayout.vue')).default;
    shallowMount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-layout': { template: '<div><slot /></div>' },
          'q-header': { template: '<header><slot /></header>' },
          'q-toolbar': { template: '<div><slot /></div>' },
          'q-toolbar-title': { template: '<span><slot /></span>' },
          'q-btn': { template: '<button><slot /></button>' },
          ThemeLangSwitcher: { template: '<div />' },
          UserMenu: { template: '<div />' },
          NotificationBell: { template: '<div />' },
          'q-page-container': { template: '<main><slot /></main>' },
          'router-view': { template: '<div />' },
        },
      },
    });
    expect(mockQuasar.dark.set).toHaveBeenCalledWith(true);
  });

  it('does not render a drawer', async () => {
    const MainLayout = (await import('../MainLayout.vue')).default;
    const wrapper = shallowMount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-layout': { template: '<div><slot /></div>' },
          'q-header': { template: '<header><slot /></header>' },
          'q-toolbar': { template: '<div><slot /></div>' },
          'q-toolbar-title': { template: '<span><slot /></span>' },
          'q-btn': { template: '<button><slot /></button>' },
          ThemeLangSwitcher: { template: '<div />' },
          UserMenu: { template: '<div />' },
          NotificationBell: { template: '<div />' },
          'q-page-container': { template: '<main><slot /></main>' },
          'router-view': { template: '<div />' },
        },
      },
    });
    expect(wrapper.find('q-drawer-stub').exists()).toBe(false);
  });

  it('renders nav buttons for matches, trading, tournaments, stores', async () => {
    const MainLayout = (await import('../MainLayout.vue')).default;
    const wrapper = shallowMount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-layout': { template: '<div><slot /></div>' },
          'q-header': { template: '<header><slot /></header>' },
          'q-toolbar': { template: '<div><slot /></div>' },
          'q-toolbar-title': { template: '<span><slot /></span>' },
          'q-btn': { template: '<button class="q-btn"><slot /></button>' },
          ThemeLangSwitcher: { template: '<div />' },
          UserMenu: { template: '<div />' },
          NotificationBell: { template: '<div />' },
          'q-page-container': { template: '<main><slot /></main>' },
          'router-view': { template: '<div />' },
        },
      },
    });
    const buttons = wrapper.findAll('.q-btn');
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });
});
