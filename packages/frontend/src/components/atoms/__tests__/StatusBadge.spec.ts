import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import StatusBadge from '../StatusBadge.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    'en-US': {
      common: {
        status: {
          open: 'Open',
          confirmed: 'Confirmed',
          completed: 'Completed',
          cancelled: 'Cancelled',
          pending: 'Pending',
          resolved: 'Resolved',
          dismissed: 'Dismissed',
          active: 'Active',
          inactive: 'Inactive',
          banned: 'Banned',
          suspended: 'Suspended',
        },
      },
    },
  },
});

const createWrapper = (props: { status: string; i18nPrefix?: string }) =>
  shallowMount(StatusBadge, {
    props,
    global: {
      plugins: [i18n],
      stubs: {
        'q-badge': {
          template: '<span class="q-badge" :color="color"><slot /></span>',
          props: ['color'],
        },
      },
    },
  });

describe('StatusBadge', () => {
  it.each([
    ['open', 'positive', 'Open'],
    ['confirmed', 'positive', 'Confirmed'],
    ['completed', 'positive', 'Completed'],
    ['cancelled', 'negative', 'Cancelled'],
    ['pending', 'warning', 'Pending'],
    ['resolved', 'positive', 'Resolved'],
    ['dismissed', 'grey', 'Dismissed'],
    ['active', 'positive', 'Active'],
    ['inactive', 'grey', 'Inactive'],
    ['banned', 'negative', 'Banned'],
    ['suspended', 'warning', 'Suspended'],
  ])(
    'renders %s status with %s color and translated label',
    (status, expectedColor, expectedLabel) => {
      const wrapper = createWrapper({ status });
      const badge = wrapper.find('.q-badge');

      expect(badge.attributes('color')).toBe(expectedColor);
      expect(badge.text()).toBe(expectedLabel);
    },
  );

  it('falls back to capitalized status when translation is missing', () => {
    const wrapper = createWrapper({ status: 'archived' });
    const badge = wrapper.find('.q-badge');

    expect(badge.attributes('color')).toBe('grey');
    expect(badge.text()).toBe('Archived');
  });

  it('uses custom i18n prefix when provided', () => {
    const wrapper = shallowMount(StatusBadge, {
      props: { status: 'shipped', i18nPrefix: 'order.status' },
      global: {
        plugins: [
          createI18n({
            legacy: false,
            locale: 'en-US',
            missingWarn: false,
            fallbackWarn: false,
            messages: {
              'en-US': {
                order: {
                  status: {
                    shipped: 'Shipped',
                  },
                },
              },
            },
          }),
        ],
        stubs: {
          'q-badge': {
            template: '<span class="q-badge" :color="color"><slot /></span>',
            props: ['color'],
          },
        },
      },
    });

    expect(wrapper.find('.q-badge').text()).toBe('Shipped');
  });
});
