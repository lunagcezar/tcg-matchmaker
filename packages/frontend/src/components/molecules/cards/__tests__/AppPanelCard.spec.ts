import { shallowMount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';

import AppPanelCard from '../AppPanelCard.vue';

const stubs = {
  'q-card': { template: '<div class="q-card"><slot /></div>' },
  'q-card-section': { template: '<div class="q-card-section"><slot /></div>' },
  'q-card-actions': {
    name: 'q-card-actions',
    template: '<div class="q-card-actions"><slot /></div>',
    props: ['align', 'class'],
  },
};

const createWrapper = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  shallowMount(AppPanelCard, {
    props,
    slots,
    global: { stubs },
  });

describe('AppPanelCard', () => {
  it('renders the title heading as h6 by default', () => {
    const wrapper = createWrapper({ title: 'Participants' });

    const heading = wrapper.find('h6');
    expect(heading.exists()).toBe(true);
    expect(heading.text()).toBe('Participants');
  });

  it('renders an h5 heading when titleTag is h5', () => {
    const wrapper = createWrapper({ title: 'Match Details', titleTag: 'h5' });

    expect(wrapper.find('h5').exists()).toBe(true);
    expect(wrapper.find('h5').text()).toBe('Match Details');
  });

  it('renders the title slot inside the title section', () => {
    const wrapper = createWrapper({}, { title: '<h4 class="custom-title">Custom</h4>' });

    const titleSection = wrapper.find('.q-card-section');
    expect(titleSection.find('.custom-title').exists()).toBe(true);
  });

  it('renders the default slot directly inside q-card', () => {
    const wrapper = createWrapper(
      { title: 'Card' },
      { default: '<div class="body">content</div>' },
    );

    expect(wrapper.find('.body').exists()).toBe(true);
  });

  it('renders the actions slot inside q-card-actions', () => {
    const wrapper = createWrapper(
      { title: 'Card' },
      { actions: '<button class="act">Go</button>' },
    );

    expect(wrapper.find('.q-card-actions').find('.act').exists()).toBe(true);
  });

  it('omits the actions section when no actions slot is provided', () => {
    const wrapper = createWrapper({ title: 'Card' });

    expect(wrapper.find('.q-card-actions').exists()).toBe(false);
  });

  it('forwards actionsAlign to q-card-actions', () => {
    const wrapper = createWrapper(
      { title: 'Card', actionsAlign: 'right' },
      { actions: '<button>Go</button>' },
    );

    const actions = wrapper.findComponent({ name: 'q-card-actions' });
    expect(actions.props('align')).toBe('right');
  });

  it('forwards actionsClass to q-card-actions', () => {
    const wrapper = createWrapper(
      { title: 'Card', actionsClass: 'q-pa-md q-gutter-sm' },
      { actions: '<button>Go</button>' },
    );

    const actions = wrapper.findComponent({ name: 'q-card-actions' });
    expect(actions.props('class')).toContain('q-pa-md');
  });

  it('declares a cardClass prop', () => {
    const wrapper = shallowMount(AppPanelCard, {
      props: { title: 'Card', cardClass: 'q-mt-md' },
      global: { stubs },
    });

    expect(wrapper.vm.$props.cardClass).toBe('q-mt-md');
  });
});
