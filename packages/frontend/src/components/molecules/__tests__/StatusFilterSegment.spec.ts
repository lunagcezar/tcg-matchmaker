import { shallowMount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';

import StatusFilterSegment from '../StatusFilterSegment.vue';

const options = [
  { label: 'All', value: 'all', icon: 'list' },
  { label: 'Open', value: 'open', icon: 'check' },
  { label: 'Closed', value: 'closed' },
];

const createWrapper = (props: { modelValue: string }) =>
  shallowMount(StatusFilterSegment, {
    props: { ...props, options },
    global: {
      stubs: {
        'q-btn-toggle': {
          name: 'q-btn-toggle',
          template: '<div class="q-btn-toggle"><slot /></div>',
          props: ['modelValue', 'options'],
        },
      },
    },
  });

describe('StatusFilterSegment', () => {
  it('passes options and current value to q-btn-toggle', () => {
    const wrapper = createWrapper({ modelValue: 'open' });
    const toggle = wrapper.findComponent({ name: 'q-btn-toggle' });

    expect(toggle.exists()).toBe(true);
    expect(toggle.props('modelValue')).toBe('open');
    expect(toggle.props('options')).toEqual(options);
  });

  it('emits update:modelValue when q-btn-toggle changes', async () => {
    const wrapper = createWrapper({ modelValue: 'all' });
    const toggle = wrapper.findComponent({ name: 'q-btn-toggle' });

    await toggle.vm.$emit('update:modelValue', 'open');

    expect(wrapper.emitted('update:modelValue')).toEqual([['open']]);
  });

  it('applies the filter-segment class', () => {
    const wrapper = createWrapper({ modelValue: 'all' });

    expect(wrapper.find('.filter-segment').exists()).toBe(true);
  });
});
