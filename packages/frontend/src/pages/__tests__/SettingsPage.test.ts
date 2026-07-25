import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
});

const mockAuthStore = vi.hoisted(() => ({
  user: { id: 'u1', email: 'test@test.com' },
  profile: { username: 'testuser' },
  loading: false,
  restoreSession: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
  updatePassword: vi.fn(),
  checkOnboarding: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: {} })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));
vi.mock('quasar', () => ({
  useQuasar: vi.fn(() => ({
    dialog: vi.fn(() => ({ onOk: vi.fn() })),
    notify: vi.fn(),
  })),
}));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: vi.fn(() => mockAuthStore) }));
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@/composables/useApi', () => ({
  apiGet: vi.fn().mockResolvedValue({ data: { username: 'testuser' } }),
  apiDelete: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': {
      nav: { settings: 'Settings' },
      auth: {
        username: 'Username',
        signOut: 'Sign Out',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        minLength: 'Must be at least {min} characters',
        passwordsDontMatch: 'Passwords do not match',
      },
      common: { save: 'Save' },
      settings: {
        tabProfile: 'Profile',
        tabPassword: 'Password',
        tabAccount: 'Account',
        dangerZone: 'Danger Zone',
        deleteAccount: 'Delete Account',
        suspendAccount: 'Suspend Account',
        downloadData: 'Download My Data',
        deleteAccountConfirm: 'Confirm delete',
        suspendAccountConfirm: 'Confirm suspend',
        confirmDelete: 'Confirm Delete',
      },
    },
  },
});

function stubs() {
  return {
    'q-page': { template: '<div><slot /></div>' },
    AppCard: {
      template: '<div class="app-card"><slot name="title" /><slot /></div>',
    },
    QTabs: { template: '<div class="q-tabs"><slot /></div>' },
    QTab: {
      template: '<div class="q-tab">{{ label }}<slot /></div>',
      props: ['label', 'name', 'icon'],
    },
    QTabPanels: { template: '<div class="q-tab-panels"><slot /></div>' },
    QTabPanel: { template: '<div class="q-tab-panel"><slot /></div>' },
    QSeparator: { template: '<hr />' },
    QInput: {
      template: '<input class="q-input" :value="modelValue" />',
      props: ['modelValue', 'label'],
    },
    QBtn: {
      template: '<button class="q-btn"><slot />{{ label }}</button>',
      props: ['label', 'to', 'icon'],
    },
    ProfileSettingsSection: {
      template: '<div class="profile-section"><slot /></div>',
      props: ['modelValue', 'saving', 'message', 'error'],
    },
    PasswordSettingsSection: {
      template: '<div class="password-section"><slot /></div>',
      props: ['saving', 'message', 'error'],
    },
    DangerZoneSection: {
      template: '<div class="danger-section"><slot /></div>',
      props: ['deleteLoading', 'suspendLoading', 'exportLoading'],
    },
  };
}

describe('SettingsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the settings page', async () => {
    const SettingsPage = (await import('../SettingsPage.vue')).default;
    const wrapper = mount(SettingsPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders three tabs (Profile, Password, Account)', async () => {
    const SettingsPage = (await import('../SettingsPage.vue')).default;
    const wrapper = mount(SettingsPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });

    const tabs = wrapper.findAll('.q-tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0].text()).toContain('Profile');
    expect(tabs[1].text()).toContain('Password');
    expect(tabs[2].text()).toContain('Account');
  });

  it('shows username from profile', async () => {
    const SettingsPage = (await import('../SettingsPage.vue')).default;
    const wrapper = mount(SettingsPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: stubs(),
      },
    });

    const vm = wrapper.vm as unknown as { username: string };
    expect(vm.username).toBe('testuser');
  });
});
