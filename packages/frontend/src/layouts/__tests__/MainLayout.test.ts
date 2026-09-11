import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createI18n } from 'vue-i18n';

const mockRoutePath = ref('/');

const mockAuthStore = vi.hoisted(() => ({
  user: null,
  profile: null,
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
  RouterLink: { template: '<a><slot /></a>' },
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

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      app: { title: 'TCG Matchmaker' },
      nav: {
        home: 'Home',
        matches: 'Matches',
        trading: 'Trading',
        tournaments: 'Tournaments',
        stores: 'Stores',
        admin: 'Admin',
      },
      admin: {
        dashboard: 'Dashboard',
        manageTcgs: 'TCGs',
        manageUsers: 'Users',
        manageStores: 'Stores',
        reports: 'Reports',
        auditLog: 'Audit Log',
      },
      sidebar: { copyright: '© Luna G. Cezar —' },
    },
  },
});

function stubs() {
  return {
    'q-layout': { template: '<div><slot /></div>' },
    'q-btn': { template: '<button class="q-btn"><slot /></button>' },
    'q-btn-dropdown': { template: '<div class="q-btn-dropdown"><slot /></div>' },
    'q-avatar': { template: '<div class="q-avatar"><slot /></div>' },
    'q-icon': { template: '<span />' },
    'q-badge': { template: '<span />' },
    'q-separator': { template: '<hr />' },
    'q-list': { template: '<ul><slot /></ul>' },
    'q-item': { template: '<li><slot /></li>' },
    'q-item-section': { template: '<div><slot /></div>' },
    'q-item-label': { template: '<div><slot /></div>' },
    'q-page-container': { template: '<main><slot /></main>' },
    'q-page': { template: '<div><slot /></div>' },
    'router-link': { template: '<a class="router-link"><slot /></a>' },
    'router-view': { template: '<div />' },
    ThemeLangSwitcher: { template: '<div class="theme-lang" />' },
    UserMenu: { template: '<div class="user-menu" />' },
    NotificationBell: { template: '<div class="notification-bell" />' },
  };
}

describe('MainLayout', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockRoutePath.value = '/';
    mockAuthStore.user = null;
    mockAuthStore.profile = null;
  });

  it('renders app title in navbar', async () => {
    const MainLayout = (await import('../MainLayout.vue')).default;
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    expect(wrapper.text()).toContain('TCG Matchmaker');
  });

  it('applies dark mode on mount', async () => {
    mockAppStore.darkMode = true;
    const MainLayout = (await import('../MainLayout.vue')).default;
    mount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    expect(mockQuasar.dark.set).toHaveBeenCalledWith(true);
  });

  it('renders sidebar navigation links on desktop', async () => {
    const MainLayout = (await import('../MainLayout.vue')).default;
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    const sidebar = wrapper.find('.app-sidebar');
    expect(sidebar.exists()).toBe(true);
    expect(sidebar.text()).toContain('Home');
    expect(sidebar.text()).toContain('Matches');
    expect(sidebar.text()).toContain('Trading');
    expect(sidebar.text()).toContain('Tournaments');
    expect(sidebar.text()).toContain('Stores');
  });

  it('does not render admin link when user is not admin', async () => {
    const MainLayout = (await import('../MainLayout.vue')).default;
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    const sidebar = wrapper.find('.app-sidebar');
    expect(sidebar.text()).not.toContain('Admin');
  });

  it('renders admin link and children when user is admin', async () => {
    mockAuthStore.user = { id: '1', email: 'a@b.com' } as never;
    mockAuthStore.profile = { role: 'admin' } as never;
    mockRoutePath.value = '/admin';
    const MainLayout = (await import('../MainLayout.vue')).default;
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    await nextTick();
    const sidebar = wrapper.find('.app-sidebar');
    expect(sidebar.text()).toContain('Admin');
    expect(sidebar.text()).toContain('Dashboard');
    expect(sidebar.text()).toContain('TCGs');
  });

  it('renders sidebar copyright footer', async () => {
    const MainLayout = (await import('../MainLayout.vue')).default;
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    const footer = wrapper.find('.app-sidebar__footer');
    expect(footer.exists()).toBe(true);
    expect(footer.text()).toContain('Luna G. Cezar');
    expect(footer.text()).toContain('artemisluna.com.br');
  });

  it('toggles mobile drawer', async () => {
    const MainLayout = (await import('../MainLayout.vue')).default;
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    const drawer = wrapper.find('[data-testid="mobile-drawer"]');
    expect(drawer.classes()).not.toContain('app-mobile-drawer--open');
    await wrapper.find('.app-navbar__toggle').trigger('click');
    expect(drawer.classes()).toContain('app-mobile-drawer--open');
  });
});
