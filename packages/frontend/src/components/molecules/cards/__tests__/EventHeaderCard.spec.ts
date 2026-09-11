import { shallowMount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { createI18n } from 'vue-i18n';

import StatusBadge from '@/components/atoms/StatusBadge.vue';

import EventHeaderCard from '../EventHeaderCard.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    'en-US': {
      event: {
        confirm: 'Confirm',
        decline: 'Decline',
        confirmed: 'Confirmed',
      },
    },
  },
});

const stubs = {
  'q-card': { template: '<div><slot /></div>' },
  'q-card-section': { template: '<div><slot /></div>' },
  'q-card-actions': { template: '<div class="q-card-actions"><slot /></div>' },
  'q-badge': { template: '<span class="q-badge"><slot /></span>' },
  'q-btn': {
    name: 'q-btn',
    template: '<button class="q-btn">{{ label }}<slot /></button>',
    props: ['loading', 'label'],
  },
};

const createWrapper = (props: {
  title: string;
  status: string;
  participation: { user_id?: string; status?: string } | null;
  confirming?: boolean;
  declining?: boolean;
}) =>
  shallowMount(EventHeaderCard, {
    props,
    global: { plugins: [i18n], stubs },
  });

describe('EventHeaderCard', () => {
  it('renders the title and a StatusBadge', () => {
    const wrapper = createWrapper({ title: 'Match Details', status: 'open', participation: null });

    expect(wrapper.find('h5').text()).toBe('Match Details');
    expect(wrapper.findComponent(StatusBadge).exists()).toBe(true);
  });

  it('shows confirm and decline buttons for a pending participation', () => {
    const wrapper = createWrapper({
      title: 'Match Details',
      status: 'open',
      participation: { user_id: 'u1', status: 'pending' },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(wrapper.text()).toContain('Confirm');
    expect(wrapper.text()).toContain('Decline');
  });

  it('emits confirm when the confirm button is clicked', async () => {
    const wrapper = createWrapper({
      title: 'Match Details',
      status: 'open',
      participation: { user_id: 'u1', status: 'pending' },
    });

    await wrapper.findAll('button')[0].trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('emits decline when the decline button is clicked', async () => {
    const wrapper = createWrapper({
      title: 'Match Details',
      status: 'open',
      participation: { user_id: 'u1', status: 'pending' },
    });

    await wrapper.findAll('button')[1].trigger('click');

    expect(wrapper.emitted('decline')).toHaveLength(1);
  });

  it('shows a confirmed badge and no action buttons for a confirmed participation', () => {
    const wrapper = createWrapper({
      title: 'Match Details',
      status: 'open',
      participation: { user_id: 'u1', status: 'confirmed' },
    });

    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(wrapper.find('.q-badge').text()).toContain('Confirmed');
  });

  it('renders no participation actions when participation is null', () => {
    const wrapper = createWrapper({ title: 'Match Details', status: 'open', participation: null });

    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(wrapper.findAll('.q-badge')).toHaveLength(0);
  });

  it('forwards confirming and declining loading flags to the buttons', () => {
    const wrapper = createWrapper({
      title: 'Match Details',
      status: 'open',
      participation: { user_id: 'u1', status: 'pending' },
      confirming: true,
      declining: true,
    });

    const buttons = wrapper.findAllComponents({ name: 'q-btn' });
    expect(buttons[0].props('loading')).toBe(true);
    expect(buttons[1].props('loading')).toBe(true);
  });

  it('renders the meta slot content inside a card section', () => {
    const wrapper = shallowMount(EventHeaderCard, {
      props: { title: 'Match Details', status: 'open', participation: null },
      slots: { default: '<div class="meta">Date: today</div>' },
      global: { plugins: [i18n], stubs },
    });

    expect(wrapper.find('.meta').exists()).toBe(true);
  });

  it('renders the actions slot content inside q-card-actions', () => {
    const wrapper = shallowMount(EventHeaderCard, {
      props: { title: 'Match Details', status: 'open', participation: null },
      slots: { actions: '<button class="join-btn">Join</button>' },
      global: { plugins: [i18n], stubs },
    });

    const joinBtn = wrapper.find('.join-btn');
    expect(joinBtn.exists()).toBe(true);
    expect(wrapper.find('.q-card-actions').find('.join-btn').exists()).toBe(true);
  });
});
