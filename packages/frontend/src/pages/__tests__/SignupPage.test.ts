import { shallowMount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';

const mockAuthStore = vi.hoisted(() => ({
  user: null,
  loading: false,
  restoreSession: vi.fn(),
  signUp: vi.fn().mockResolvedValue({}),
  signOut: vi.fn(),
  checkOnboarding: vi.fn().mockResolvedValue(false),
}));

const mockNotify = vi.fn();

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@/composables/useApi', () => ({
  apiPost: vi.fn().mockResolvedValue({ data: { success: true } }),
}));
vi.mock('quasar', () => ({
  useQuasar: vi.fn(() => ({ notify: mockNotify })),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      auth: { signUp: 'Sign Up', haveAccount: 'Already have an account?', signIn: 'Sign In' },
    },
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/signup', name: 'signup', component: {} as never }],
});

describe('SignupPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders the signup form', async () => {
    const SignupPage = (await import('../auth/SignupPage.vue')).default;
    const wrapper = shallowMount(SignupPage, {
      global: {
        plugins: [i18n, router, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          AppCard: { template: '<div><slot /></div>' },
          AuthForm: { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('calls signUp on registration', async () => {
    const SignupPage = (await import('../auth/SignupPage.vue')).default;
    const wrapper = shallowMount(SignupPage, {
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
      handleSignup: (data: { email: string; password: string }) => Promise<void>;
    };
    await vm.handleSignup({ email: 'test@test.com', password: 'password123' });
    expect(mockAuthStore.signUp).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('shows notification on successful signup', async () => {
    const SignupPage = (await import('../auth/SignupPage.vue')).default;
    const wrapper = shallowMount(SignupPage, {
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
      handleSignup: (data: { email: string; password: string }) => Promise<void>;
    };
    await vm.handleSignup({ email: 'test@test.com', password: 'password123' });
    expect(mockNotify).toHaveBeenCalledWith({
      type: 'positive',
      message: 'Account created! You can now sign in.',
    });
  });

  it('passes fields without displayName to AuthForm', async () => {
    const SignupPage = (await import('../auth/SignupPage.vue')).default;
    const wrapper = shallowMount(SignupPage, {
      global: {
        plugins: [i18n, router, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          AppCard: { template: '<div><slot /></div>' },
          AuthForm: {
            template: '<div class="auth-form-stub" />',
            props: ['fields'],
          },
        },
      },
    });

    const authForm = wrapper.find('.auth-form-stub');
    expect(authForm.exists()).toBe(true);
  });

  it('shows error message when signUp fails', async () => {
    mockAuthStore.signUp.mockRejectedValueOnce(new Error('Email already in use'));

    const SignupPage = (await import('../auth/SignupPage.vue')).default;
    const wrapper = shallowMount(SignupPage, {
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
      handleSignup: (data: { email: string; password: string }) => Promise<void>;
      error: string;
    };
    await vm.handleSignup({ email: 'test@test.com', password: 'password123' });
    expect(vm.error).toBe('Email already in use');
  });

  it('clears error before new submit', async () => {
    mockAuthStore.signUp.mockRejectedValueOnce(new Error('First error'));
    mockAuthStore.signUp.mockResolvedValueOnce({});

    const SignupPage = (await import('../auth/SignupPage.vue')).default;
    const wrapper = shallowMount(SignupPage, {
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
      handleSignup: (data: { email: string; password: string }) => Promise<void>;
      error: string;
    };
    await vm.handleSignup({ email: 'test@test.com', password: 'wrong' });
    expect(vm.error).toBe('First error');

    await vm.handleSignup({ email: 'test@test.com', password: 'correct' });
    expect(vm.error).toBe('');
  });
});
