import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';

import SiteBranch from '@/components/molecules/navigation/SiteBranch.vue';

const mockRoutePath = ref('/');

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ path: mockRoutePath.value })),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: { home: 'Home', matches: 'Matches', admin: 'Admin' },
      admin: { dashboard: 'Dashboard', manageUsers: 'Users' },
    },
  },
});

const routerLinkStub = {
  props: ['to'],
  template: '<a :href="to" class="router-link"><slot /></a>',
};

function mountBranch(props: Record<string, unknown>) {
  return mount(SiteBranch, {
    global: {
      plugins: [i18n],
      stubs: { 'router-link': routerLinkStub },
    },
    props,
  });
}

describe('SiteBranch', () => {
  beforeEach(() => {
    mockRoutePath.value = '/';
  });

  it('renders a simple nav link', () => {
    const wrapper = mountBranch({ node: { labelKey: 'nav.home', href: '/' } });
    expect(wrapper.text()).toContain('Home');
    expect(wrapper.find('.app-nav-link--active').exists()).toBe(true);
  });

  it('expands children when route is inside node href', () => {
    mockRoutePath.value = '/admin/users';
    const wrapper = mountBranch({
      node: {
        labelKey: 'nav.admin',
        href: '/admin',
        children: [
          { labelKey: 'admin.dashboard', href: '/admin' },
          { labelKey: 'admin.manageUsers', href: '/admin/users' },
        ],
      },
    });
    expect(wrapper.text()).toContain('Admin');
    expect(wrapper.text()).toContain('Dashboard');
    expect(wrapper.text()).toContain('Users');
  });

  it('does not expand children when route is outside node href', () => {
    mockRoutePath.value = '/matches';
    const wrapper = mountBranch({
      node: {
        labelKey: 'nav.admin',
        href: '/admin',
        children: [
          { labelKey: 'admin.dashboard', href: '/admin' },
          { labelKey: 'admin.manageUsers', href: '/admin/users' },
        ],
      },
    });
    expect(wrapper.text()).toContain('Admin');
    expect(wrapper.text()).not.toContain('Dashboard');
  });

  it('emits navigate event when clicked', async () => {
    const wrapper = mountBranch({ node: { labelKey: 'nav.home', href: '/' } });
    await wrapper.find('.app-nav-link').trigger('click');
    expect(wrapper.emitted('navigate')).toHaveLength(1);
  });
});
