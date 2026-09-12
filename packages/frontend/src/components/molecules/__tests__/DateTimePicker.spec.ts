process.env.TZ = 'America/Fortaleza';

import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';

import DateTimePicker from '../DateTimePicker.vue';

const createWrapper = (props: {
  modelValue: string;
  label?: string;
  rules?: ((v: string) => true | string)[];
}) =>
  mount(DateTimePicker, {
    props,
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        'q-input': {
          template:
            '<input class="q-input" :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          props: ['type', 'modelValue'],
        },
      },
    },
  });

describe('DateTimePicker', () => {
  it('renders date and time inputs', () => {
    const wrapper = createWrapper({ modelValue: '' });
    const inputs = wrapper.findAll('.q-input');

    expect(inputs).toHaveLength(2);
    expect(inputs[0].attributes('type')).toBe('date');
    expect(inputs[1].attributes('type')).toBe('time');
  });

  it('sets initial date and time from modelValue', async () => {
    const wrapper = createWrapper({ modelValue: '2026-07-24T14:30:00.000Z' });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll('.q-input');
    expect(inputs[0].element.value).toBe('2026-07-24');
    expect(inputs[1].element.value).toBe('11:30');
  });

  it('displays the local date and time for a UTC modelValue', async () => {
    const wrapper = createWrapper({ modelValue: '2026-07-24T17:30:00.000Z' });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll('.q-input');
    expect(inputs[0].element.value).toBe('2026-07-24');
    expect(inputs[1].element.value).toBe('14:30');
  });

  it('round-trips through local time without recursive emission', async () => {
    const wrapper = createWrapper({ modelValue: '2026-07-24T17:30:00.000Z' });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll('.q-input');
    await inputs[1].setValue('16:45');

    const emitted = wrapper.emitted('update:modelValue');
    const iso = emitted?.at(-1)?.[0] as string;
    expect(iso).toBe(new Date('2026-07-24T16:45').toISOString());
    const countAfterEdit = emitted?.length ?? 0;

    await wrapper.setProps({ modelValue: iso });
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.q-input')[1].element.value).toBe('16:45');
    expect(wrapper.emitted('update:modelValue')?.length).toBe(countAfterEdit);
  });

  it('emits combined ISO string when date and time change', async () => {
    const wrapper = createWrapper({ modelValue: '' });
    const inputs = wrapper.findAll('.q-input');

    await inputs[0].setValue('2026-07-24');
    await inputs[1].setValue('14:30');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();

    const lastEmitted = emitted?.at(-1) as [string];
    expect(lastEmitted[0]).toBe(new Date('2026-07-24T14:30').toISOString());
  });

  it('emits empty string when date or time is cleared', async () => {
    const wrapper = createWrapper({ modelValue: '2026-07-24T14:30:00.000Z' });
    const inputs = wrapper.findAll('.q-input');

    await inputs[0].setValue('');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);

    await inputs[0].setValue('2026-07-24');
    await inputs[1].setValue('');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
  });

  it('emits empty string for invalid date and time combinations', async () => {
    const wrapper = createWrapper({ modelValue: '' });
    const inputs = wrapper.findAll('.q-input');

    await inputs[0].setValue('not-a-date');
    await inputs[1].setValue('14:30');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
  });
});
