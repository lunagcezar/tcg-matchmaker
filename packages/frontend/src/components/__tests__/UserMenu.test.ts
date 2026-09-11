import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

const mockAuthStore = vi.hoisted(() => ({
  user: null,
  profile: null,
  signOut: vi.fn(),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: {
        login: 'Login',
        signup: 'Sign Up',
        logout: 'Logout',
        settings: 'Settings',
        notifications: 'Notifications',
      },
    },
  },
});

describe('UserMenu', () => {
  it('shows login and signup buttons when not authenticated', async () => {
    mockAuthStore.user = null;
    const UserMenu = (await import('../molecules/UserMenu.vue')).default;
    const wrapper = mount(UserMenu, {
      global: {
        plugins: [i18n],
        stubs: {
          QBtn: {
            template: '<button class="q-btn"><slot />{{ label }}</button>',
            props: ['label', 'to'],
          },
          QBtnDropdown: { template: '<div><slot /></div>' },
          QAvatar: { template: '<div><slot /></div>' },
          QIcon: { template: '<span />' },
          QList: { template: '<ul><slot /></ul>' },
          QItem: { template: '<li><slot /></li>' },
          QItemSection: { template: '<div><slot /></div>' },
        },
      },
    });
    expect(wrapper.text()).toContain('Login');
    expect(wrapper.text()).toContain('Sign Up');
  });

  it('shows username when profile is loaded', async () => {
    mockAuthStore.user = { id: 'u1', email: 'test@test.com' };
    mockAuthStore.profile = { username: 'testuser' };
    const UserMenu = (await import('../molecules/UserMenu.vue')).default;
    const wrapper = mount(UserMenu, {
      global: {
        plugins: [i18n],
        stubs: {
          QBtn: {
            template: '<button class="q-btn"><slot />{{ label }}</button>',
            props: ['label', 'to'],
          },
          QBtnDropdown: {
            template: '<div><slot name="label" /><slot /></div>',
          },
          QAvatar: { template: '<div class="q-avatar"><slot /></div>' },
          QIcon: { template: '<span />' },
          QList: { template: '<ul><slot /></ul>' },
          QItem: { template: '<li><slot /></li>' },
          QItemSection: { template: '<div><slot /></div>' },
        },
      },
    });
    expect(wrapper.text()).toContain('testuser');
  });

  it('falls back to email prefix when profile is not loaded', async () => {
    mockAuthStore.user = { id: 'u1', email: 'test@example.com' };
    mockAuthStore.profile = null;
    const UserMenu = (await import('../molecules/UserMenu.vue')).default;
    const wrapper = mount(UserMenu, {
      global: {
        plugins: [i18n],
        stubs: {
          QBtn: {
            template: '<button class="q-btn"><slot />{{ label }}</button>',
            props: ['label', 'to'],
          },
          QBtnDropdown: {
            template: '<div><slot name="label" /><slot /></div>',
          },
          QAvatar: { template: '<div class="q-avatar"><slot /></div>' },
          QIcon: { template: '<span />' },
          QList: { template: '<ul><slot /></ul>' },
          QItem: { template: '<li><slot /></li>' },
          QItemSection: { template: '<div><slot /></div>' },
        },
      },
    });
    expect(wrapper.text()).toContain('test');
  });

  it('shows avatar initial from username', async () => {
    mockAuthStore.user = { id: 'u1', email: 'test@test.com' };
    mockAuthStore.profile = { username: 'Alice' };
    const UserMenu = (await import('../molecules/UserMenu.vue')).default;
    const wrapper = mount(UserMenu, {
      global: {
        plugins: [i18n],
        stubs: {
          QBtn: {
            template: '<button class="q-btn"><slot />{{ label }}</button>',
            props: ['label', 'to'],
          },
          QBtnDropdown: {
            template: '<div><slot name="label" /><slot /></div>',
          },
          QAvatar: { template: '<div class="q-avatar"><slot /></div>' },
          QIcon: { template: '<span />' },
          QList: { template: '<ul><slot /></ul>' },
          QItem: { template: '<li><slot /></li>' },
          QItemSection: { template: '<div><slot /></div>' },
        },
      },
    });
    const avatar = wrapper.find('.q-avatar');
    expect(avatar.text()).toBe('A');
  });
});
