process.env.TZ = 'America/Fortaleza';

import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { createI18n } from 'vue-i18n';

import DateTimePicker from '../DateTimePicker.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': {
      event: {
        date: 'event.date',
        time: 'event.time',
        inFuture: 'event.inFuture',
        tooFar: 'event.tooFar',
      },
    },
  },
});

const createWrapper = (props: {
  modelValue: string;
  label?: string;
  rules?: ((v: string) => true | string)[];
}) =>
  mount(DateTimePicker, {
    props,
    global: {
      plugins: [i18n],
      stubs: {
        'q-input': {
          template:
            '<input class="q-input" :type="type" :value="modelValue" :data-error="ruleResult" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          props: ['type', 'modelValue', 'rules'],
          computed: {
            ruleResult() {
              if (!this.rules || !this.modelValue) return '';
              const failed = this.rules
                .map((rule: (v: string) => true | string) => rule(this.modelValue))
                .filter((result: true | string) => result !== true);
              return failed[0] ?? '';
            },
          },
        },
      },
    },
  });

describe('DateTimePicker', () => {
  it('renders date and time inputs', () => {
    const wrapper = createWrapper({ modelValue: '' });
    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');

    expect(inputs).toHaveLength(2);
    expect(inputs[0].attributes('type')).toBe('date');
    expect(inputs[1].attributes('type')).toBe('time');
  });

  it('sets initial date and time from modelValue', async () => {
    const wrapper = createWrapper({ modelValue: '2026-07-24T14:30:00.000Z' });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');
    expect(inputs[0].element.value).toBe('2026-07-24');
    expect(inputs[1].element.value).toBe('11:30');
  });

  it('displays the local date and time for a UTC modelValue', async () => {
    const wrapper = createWrapper({ modelValue: '2026-07-24T17:30:00.000Z' });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');
    expect(inputs[0].element.value).toBe('2026-07-24');
    expect(inputs[1].element.value).toBe('14:30');
  });

  it('round-trips through local time without recursive emission', async () => {
    const wrapper = createWrapper({ modelValue: '2026-07-24T17:30:00.000Z' });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');
    await inputs[1].setValue('16:45');

    const emitted = wrapper.emitted('update:modelValue');
    const iso = emitted?.at(-1)?.[0] as string;
    expect(iso).toBe(new Date('2026-07-24T16:45').toISOString());
    const countAfterEdit = emitted?.length ?? 0;

    await wrapper.setProps({ modelValue: iso });
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll<HTMLInputElement>('.q-input')[1].element.value).toBe('16:45');
    expect(wrapper.emitted('update:modelValue')?.length).toBe(countAfterEdit);
  });

  it('emits combined ISO string when date and time change', async () => {
    const wrapper = createWrapper({ modelValue: '' });
    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');

    await inputs[0].setValue('2026-07-24');
    await inputs[1].setValue('14:30');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();

    const lastEmitted = emitted?.at(-1) as [string];
    expect(lastEmitted[0]).toBe(new Date('2026-07-24T14:30').toISOString());
  });

  it('emits empty string when date or time is cleared', async () => {
    const wrapper = createWrapper({ modelValue: '2026-07-24T14:30:00.000Z' });
    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');

    await inputs[0].setValue('');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);

    await inputs[0].setValue('2026-07-24');
    await inputs[1].setValue('');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
  });

  it('emits empty string for invalid date and time combinations', async () => {
    const wrapper = createWrapper({ modelValue: '' });
    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');

    await inputs[0].setValue('not-a-date');
    await inputs[1].setValue('14:30');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
  });

  it('defaults the date to today and leaves the time empty when modelValue is empty', async () => {
    const wrapper = createWrapper({ modelValue: '' });
    await wrapper.vm.$nextTick();

    const now = new Date();
    const expectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`;

    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');
    expect(inputs[0].element.value).toBe(expectedDate);
    expect(inputs[1].element.value).toBe('');
  });

  it('shows a rule error when the combined date is in the past', async () => {
    const wrapper = createWrapper({ modelValue: '2026-07-24T17:30:00.000Z' });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');
    expect(inputs[1].attributes('data-error')).toBe('event.inFuture');
  });

  it('shows a rule error when the combined date is beyond one year', async () => {
    const beyond = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString();
    const wrapper = createWrapper({ modelValue: beyond });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');
    expect(inputs[1].attributes('data-error')).toBe('event.tooFar');
  });

  it('shows no rule error for a valid future date', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const wrapper = createWrapper({ modelValue: future });
    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll<HTMLInputElement>('.q-input');
    expect(inputs[1].attributes('data-error')).toBe('');
  });
});
