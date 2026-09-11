import { shallowMount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';

import StatusBadge from '@/components/atoms/StatusBadge.vue';

import ParticipantListCard from '../ParticipantListCard.vue';

const appPanelCardStub = {
  name: 'AppPanelCard',
  props: ['title', 'titleTag'],
  template:
    '<div class="app-panel-card-stub"><div class="title-section"><slot name="title"><h6 class="q-my-none">{{ title }}</h6></slot></div><div class="body"><slot /></div><div class="actions"><slot name="actions" /></div></div>',
};

const stubs = {
  AppPanelCard: appPanelCardStub,
  'q-item': { template: '<div class="q-item"><slot /></div>' },
  'q-badge': { template: '<span class="q-badge"><slot /></span>' },
};

const createWrapper = (props: {
  title: string;
  participants: Record<string, unknown>[];
  badgeKey?: 'status' | 'role';
  emptyText?: string;
}) =>
  shallowMount(ParticipantListCard, {
    props,
    global: { stubs },
  });

describe('ParticipantListCard', () => {
  it('renders the title heading', () => {
    const wrapper = createWrapper({ title: 'Participants', participants: [] });

    expect(wrapper.find('.title-section').find('h6').text()).toBe('Participants');
  });

  it('renders a row per participant using username or a truncated user_id', () => {
    const wrapper = createWrapper({
      title: 'Participants',
      participants: [
        { id: '1', username: 'alice', status: 'confirmed' },
        { id: '2', user_id: '0123456789abcdef', status: 'pending' },
      ],
    });

    const items = wrapper.find('.body').findAll('.q-item');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain('alice');
    expect(items[1].text()).toContain('01234567');
  });

  it('renders a StatusBadge per participant when badgeKey is status', () => {
    const wrapper = createWrapper({
      title: 'Participants',
      participants: [{ id: '1', username: 'alice', status: 'confirmed' }],
    });

    expect(wrapper.findComponent(StatusBadge).exists()).toBe(true);
  });

  it('renders a plain badge with the role when badgeKey is role', () => {
    const wrapper = createWrapper({
      title: 'Members',
      participants: [{ id: '1', username: 'bob', role: 'owner' }],
      badgeKey: 'role',
    });

    expect(wrapper.findComponent(StatusBadge).exists()).toBe(false);
    expect(wrapper.find('.q-badge').text()).toBe('owner');
  });

  it('shows the empty text when emptyText is set and there are no participants', () => {
    const wrapper = createWrapper({
      title: 'Participants',
      participants: [],
      emptyText: 'No participants yet',
    });

    expect(wrapper.text()).toContain('No participants yet');
  });

  it('renders no empty state and no list when there are no participants and no emptyText', () => {
    const wrapper = createWrapper({ title: 'Participants', participants: [] });

    expect(wrapper.text()).not.toContain('No participants');
    expect(wrapper.find('.body').findAll('.q-item')).toHaveLength(0);
  });
});
