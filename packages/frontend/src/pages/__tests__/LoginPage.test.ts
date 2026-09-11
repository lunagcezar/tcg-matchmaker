import { shallowMount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';

vi.mock('@/composables/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}));

const mockAuthStore = vi.hoisted(() => ({
  user: null,
  loading: false,
  restoreSession: vi.fn(),
  signIn: vi.fn().mockResolvedValue({} as never),
  signOut: vi.fn(),
  checkOnboarding: vi.fn().mockResolvedValue(false),
  resolveIdentifier: vi.fn((id: string) => Promise.resolve(id)),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      auth: {
        signIn: 'Sign In',
        noAccount: "Don't have an account?",
        signUp: 'Sign Up',
        emailOrUsername: 'Email or Username',
      },
      nav: { login: 'Login' },
    },
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/login', name: 'login', component: {} as never }],
});

describe('LoginPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the login form', async () => {
    const LoginPage = (await import('../auth/LoginPage.vue')).default;
    const wrapper = shallowMount(LoginPage, {
      global: {
        plugins: [i18n, router, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'router-link': { template: '<a><slot /></a>' },
          AppCard: { template: '<div><slot /></div>' },
          AuthForm: { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('calls signIn on login', async () => {
    const LoginPage = (await import('../auth/LoginPage.vue')).default;
    const { useAuthStore } = await import('@/stores/useAuthStore');

    const wrapper = shallowMount(LoginPage, {
      global: {
        plugins: [i18n, router, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          AppCard: { template: '<div><slot /></div>' },
          AuthForm: { template: '<div />' },
        },
      },
    });

    const store = useAuthStore();
    const vm = wrapper.vm as unknown as {
      handleLogin: (data: { identifier: string; password: string }) => Promise<void>;
    };
    await vm.handleLogin({ identifier: 'test@test.com', password: 'password123' });
    expect(store.resolveIdentifier).toHaveBeenCalledWith('test@test.com');
    expect(store.signIn).toHaveBeenCalledWith('test@test.com', 'password123', true);
  });

  it('shows error message when signIn fails', async () => {
    mockAuthStore.signIn.mockRejectedValueOnce(new Error('Invalid credentials'));

    const LoginPage = (await import('../auth/LoginPage.vue')).default;
    const wrapper = shallowMount(LoginPage, {
      global: {
        plugins: [i18n, router, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          AppCard: { template: '<div><slot /></div>' },
          AuthForm: { template: '<div />' },
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      handleLogin: (data: { identifier: string; password: string }) => Promise<void>;
      error: string;
    };
    await vm.handleLogin({ identifier: 'test@test.com', password: 'wrong' });
    expect(vm.error).toBe('Invalid credentials');
  });

  it('clears error before new submit', async () => {
    mockAuthStore.signIn.mockRejectedValueOnce(new Error('First error'));
    mockAuthStore.signIn.mockResolvedValueOnce({} as never);

    const LoginPage = (await import('../auth/LoginPage.vue')).default;
    const wrapper = shallowMount(LoginPage, {
      global: {
        plugins: [i18n, router, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          AppCard: { template: '<div><slot /></div>' },
          AuthForm: { template: '<div />' },
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      handleLogin: (data: { identifier: string; password: string }) => Promise<void>;
      error: string;
    };
    await vm.handleLogin({ identifier: 'test@test.com', password: 'wrong' });
    expect(vm.error).toBe('First error');

    await vm.handleLogin({ identifier: 'test@test.com', password: 'correct' });
    expect(vm.error).toBe('');
  });
});
