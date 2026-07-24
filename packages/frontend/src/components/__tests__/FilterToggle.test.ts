import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import FilterToggle from '../molecules/FilterToggle.vue';

describe('FilterToggle', () => {
  it('renders options and emits update:modelValue', async () => {
    const wrapper = shallowMount(FilterToggle, {
      props: { modelValue: '', options: [{ label: 'A', value: 'a' }] },
      global: { stubs: ['q-btn-toggle'] },
    });
    expect(wrapper.exists()).toBe(true);

    await wrapper.findComponent({ name: 'q-btn-toggle' }).vm.$emit('update:modelValue', 'a');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
