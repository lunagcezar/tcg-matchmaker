import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
});

const mockAuthStore = vi.hoisted(() => ({
  user: { id: 'u1', email: 'test@test.com' },
  loading: false,
  restoreSession: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
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
  apiGet: vi.fn().mockResolvedValue({ data: { display_name: 'Test' } }),
  apiDelete: vi.fn(),
  apiPost: vi.fn(),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: { settings: 'Settings' },
      auth: { displayName: 'Display Name', signOut: 'Sign Out' },
      common: {
        save: 'Save',
        language: 'Language',
        darkMode: 'Dark Mode',
        cancel: 'Cancel',
        confirm: 'Confirm',
        delete: 'Delete',
      },
      notifications: { enablePush: 'Enable Push Notifications' },
      settings: {
        dangerZone: 'Danger Zone',
        deleteAccount: 'Delete Account',
        suspendAccount: 'Suspend Account',
        downloadData: 'Download My Data',
      },
    },
  },
});

describe('SettingsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the settings page', async () => {
    const SettingsPage = (await import('../SettingsPage.vue')).default;
    const wrapper = shallowMount(SettingsPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-input': { template: '<input />' },
          'q-btn': { template: '<button><slot /></button>' },
          'q-select': { template: '<select />' },
          'q-toggle': { template: '<input type="checkbox" />' },
          'q-separator': { template: '<hr />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
