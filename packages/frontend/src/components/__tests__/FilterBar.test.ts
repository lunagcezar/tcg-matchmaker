import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import FilterBar from '../organisms/home/FilterBar.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: { 'en-US': { home: { findNearMe: 'Find near me' } } },
});

describe('FilterBar', () => {
  it('renders with default props', () => {
    const wrapper = shallowMount(FilterBar, {
      props: { modelValue: [] },
      global: {
        plugins: [i18n],
        stubs: ['q-btn-toggle', 'q-btn'],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
