import { shallowMount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';

describe('AppCardLayout', () => {
  it('renders title in the header', async () => {
    const AppCard = (await import('../AppCardLayout.vue')).default;
    const wrapper = shallowMount(AppCard, {
      props: { title: 'Test Title' },
      global: {
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-chip': { template: '<span><slot /></span>' },
        },
      },
    });
    expect(wrapper.text()).toContain('Test Title');
  });

  it('renders error message as q-chip', async () => {
    const AppCard = (await import('../AppCardLayout.vue')).default;
    const wrapper = shallowMount(AppCard, {
      props: { error: 'Something went wrong' },
      global: {
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-chip': { template: '<span class="q-chip-stub"><slot /></span>' },
        },
      },
    });
    expect(wrapper.text()).toContain('Something went wrong');
    expect(wrapper.find('.q-chip-stub').exists()).toBe(true);
  });

  it('renders success message as q-chip', async () => {
    const AppCard = (await import('../AppCardLayout.vue')).default;
    const wrapper = shallowMount(AppCard, {
      props: { success: 'Operation completed' },
      global: {
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-chip': { template: '<span class="q-chip-stub"><slot /></span>' },
        },
      },
    });
    expect(wrapper.text()).toContain('Operation completed');
    expect(wrapper.find('.q-chip-stub').exists()).toBe(true);
  });

  it('renders notifications between header and body', async () => {
    const AppCard = (await import('../AppCardLayout.vue')).default;
    const wrapper = shallowMount(AppCard, {
      props: { error: 'Error message', title: 'Test' },
      global: {
        stubs: {
          'q-page': { template: '<div><slot /></div>' },
          'q-chip': { template: '<span><slot /></span>' },
        },
      },
    });
    const header = wrapper.find('.app-panel__header');
    const notifications = wrapper.find('.app-panel__notifications');
    const body = wrapper.find('.app-panel__body');

    expect(header.exists()).toBe(true);
    expect(notifications.exists()).toBe(true);
    expect(body.exists()).toBe(true);
  });
});
