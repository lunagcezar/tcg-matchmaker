import { shallowMount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';

import StoreCard from '../StoreCard.vue';

const appPanelCardStub = {
  name: 'AppPanelCard',
  props: ['cardClass'],
  template:
    '<div class="app-panel-card-stub"><div class="title-section"><slot name="title" /></div><div class="body"><slot /></div></div>',
};

const stubs = {
  AppPanelCard: appPanelCardStub,
  'q-icon': {
    name: 'q-icon',
    template: '<span class="q-icon" :data-name="name" :data-color="color" />',
    props: ['name', 'color', 'size'],
  },
  'q-card-section': { template: '<div class="q-card-section"><slot /></div>' },
};

const createWrapper = (props: { store: Record<string, unknown> }) =>
  shallowMount(StoreCard, {
    props: props as { store: Record<string, unknown> },
    global: { stubs },
  });

const baseStore = {
  id: 's1',
  name: 'Mana Games',
  is_verified: false,
  address: 'Rua A, 123',
  city: 'Fortaleza',
  state: 'Ceará',
};

describe('StoreCard', () => {
  it('renders the store name in the title section', () => {
    const wrapper = createWrapper({ store: baseStore });

    const title = wrapper.find('.title-section');
    expect(title.find('h5').text()).toBe('Mana Games');
  });

  it('renders the verified icon when the store is verified', () => {
    const wrapper = createWrapper({ store: { ...baseStore, is_verified: true } });

    const icon = wrapper.find('.title-section').find('.q-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('data-name')).toBe('check_circle');
    expect(icon.attributes('data-color')).toBe('positive');
  });

  it('does not render the verified icon when the store is not verified', () => {
    const wrapper = createWrapper({ store: baseStore });

    expect(wrapper.find('.title-section').find('.q-icon').exists()).toBe(false);
  });

  it('renders the formatted address in the body section', () => {
    const wrapper = createWrapper({ store: baseStore });

    const body = wrapper.find('.body');
    expect(body.text()).toContain('Rua A, 123');
    expect(body.text()).toContain('Fortaleza');
    expect(body.text()).toContain('Ceará');
  });

  it('forwards q-mt-md as cardClass to AppPanelCard', () => {
    const wrapper = shallowMount(StoreCard, {
      props: { store: baseStore },
      global: { stubs },
    });

    const panel = wrapper.findComponent(appPanelCardStub);
    expect(panel.props('cardClass')).toBe('q-mt-md');
  });
});
