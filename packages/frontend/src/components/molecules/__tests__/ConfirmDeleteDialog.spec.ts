import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    'en-US': {
      common: {
        cancel: 'Cancel',
      },
    },
  },
});

const createWrapper = (props: {
  modelValue: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  confirmColor?: string;
}) =>
  shallowMount(ConfirmDeleteDialog, {
    props,
    global: {
      plugins: [i18n],
      stubs: {
        'q-dialog': {
          name: 'q-dialog',
          template: '<div v-if="modelValue" class="q-dialog"><slot /></div>',
          props: ['modelValue'],
        },
        'q-card': { name: 'q-card', template: '<div class="q-card"><slot /></div>' },
        'q-card-section': {
          name: 'q-card-section',
          template: '<div class="q-card-section"><slot /></div>',
        },
        'q-card-actions': {
          name: 'q-card-actions',
          template: '<div class="q-card-actions"><slot /></div>',
        },
        'q-btn': {
          name: 'q-btn',
          emits: ['click'],
          template: '<button class="q-btn" @click="$emit(\'click\')"><slot />{{ label }}</button>',
          props: ['label', 'color'],
        },
      },
    },
  });

describe('ConfirmDeleteDialog', () => {
  it('renders dialog content when modelValue is true', () => {
    const wrapper = createWrapper({ modelValue: true });

    expect(wrapper.find('.q-dialog').exists()).toBe(true);
    expect(wrapper.text()).toContain('Confirm Delete');
    expect(wrapper.text()).toContain('Are you sure you want to delete this?');
  });

  it('does not render dialog content when modelValue is false', () => {
    const wrapper = createWrapper({ modelValue: false });

    expect(wrapper.find('.q-dialog').exists()).toBe(false);
  });

  it('uses custom props for title, message and confirm label', () => {
    const wrapper = createWrapper({
      modelValue: true,
      title: 'Remove Store',
      message: 'This will permanently remove the store.',
      confirmLabel: 'Remove',
      confirmColor: 'warning',
    });

    expect(wrapper.text()).toContain('Remove Store');
    expect(wrapper.text()).toContain('This will permanently remove the store.');

    const confirmButton = wrapper
      .findAllComponents({ name: 'q-btn' })
      .find((b) => b.text().includes('Remove'));
    expect(confirmButton).toBeDefined();
    expect(confirmButton?.props('color')).toBe('warning');
  });

  it('emits confirm when confirm button is clicked', async () => {
    const wrapper = createWrapper({ modelValue: true });
    const confirmButton = wrapper
      .findAllComponents({ name: 'q-btn' })
      .find((b) => b.text().includes('Delete'));

    await confirmButton?.trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('emits cancel and update:modelValue(false) when cancel button is clicked', async () => {
    const wrapper = createWrapper({ modelValue: true });
    const cancelButton = wrapper
      .findAllComponents({ name: 'q-btn' })
      .find((b) => b.text().includes('Cancel'));

    await cancelButton?.trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('emits cancel and update:modelValue(false) when dialog is dismissed', async () => {
    const wrapper = createWrapper({ modelValue: true });
    const dialog = wrapper.findComponent({ name: 'q-dialog' });

    await dialog.vm.$emit('update:modelValue', false);

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });
});
