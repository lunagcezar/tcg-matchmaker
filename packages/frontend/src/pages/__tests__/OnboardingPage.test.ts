import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

const mockAuthStore = vi.hoisted(() => ({
  user: null,
  loading: false,
  restoreSession: vi.fn(),
  checkOnboarding: vi.fn().mockResolvedValue(true),
  onboardingRequired: null,
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@/composables/useApi', () => ({
  apiPost: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      auth: {
        signUp: 'Sign Up',
        onboarding: 'Welcome!',
        required: 'Required',
        invalidEmail: 'Invalid email',
        minLength: 'Must be at least {min} characters',
        passwordsDontMatch: 'Passwords do not match',
        confirmPassword: 'Confirm Password',
      },
    },
  },
});

describe('OnboardingPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockAuthStore.checkOnboarding.mockResolvedValue(true);
    mockAuthStore.onboardingRequired = null;
  });

  it('renders the onboarding form', async () => {
    const OnboardingPage = (await import('../auth/OnboardingPage.vue')).default;
    const wrapper = shallowMount(OnboardingPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          AppCard: { template: '<div><slot /></div>' },
          AuthForm: { template: '<div />' },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('shows error message when API returns error', async () => {
    const { apiPost } = await import('@/composables/useApi');
    (apiPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: 'Email already registered',
    });

    const OnboardingPage = (await import('../auth/OnboardingPage.vue')).default;
    const wrapper = shallowMount(OnboardingPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          AppCard: { template: '<div><slot /></div>' },
          AuthForm: { template: '<div />' },
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      handleOnboarding: (data: {
        email: string;
        password: string;
        username?: string;
        displayName?: string;
      }) => Promise<void>;
    };
    await vm.handleOnboarding({
      email: 'admin@test.com',
      password: 'password123',
      username: 'admin',
      displayName: 'Admin',
    });
    expect(wrapper.text()).toContain('Email already registered');
  });

  it('shows success message after creation', async () => {
    const { apiPost } = await import('@/composables/useApi');
    (apiPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 'new-admin' },
      error: null,
    });

    const OnboardingPage = (await import('../auth/OnboardingPage.vue')).default;
    const wrapper = shallowMount(OnboardingPage, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          AppCard: { template: '<div><slot /></div>' },
          AuthForm: { template: '<div />' },
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      handleOnboarding: (data: {
        email: string;
        password: string;
        username?: string;
        displayName?: string;
      }) => Promise<void>;
      success: string;
    };
    await vm.handleOnboarding({
      email: 'admin@test.com',
      password: 'password123',
      username: 'admin',
      displayName: 'Admin',
    });
    expect(vm.success).toBe('Admin account created! Redirecting to login...');
  });
});
