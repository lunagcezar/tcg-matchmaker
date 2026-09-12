<template>
  <div class="row">
    <div class="col-6">
      <q-input
        v-model="date"
        type="date"
        :label="$t('event.date')"
        :rules="inputRules"
        outlined
        class="date-time-picker__date"
      />
    </div>
    <div class="col-6">
      <q-input
        v-model="time"
        type="time"
        :label="$t('event.time')"
        :rules="inputRules"
        outlined
        class="date-time-picker__time"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { scheduledAtError } from '@/lib/eventSchedule';

export interface DateTimePickerProps {
  modelValue: string;
  label?: string;
  rules?: ((v: string) => true | string)[];
}

const props = defineProps<DateTimePickerProps>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const date = ref('');
const time = ref('');
const { t } = useI18n();

function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const combinedRule = (_value: string): true | string => {
  const err = scheduledAtError(toIso(date.value, time.value));
  if (err === 'in_past') return t('event.inFuture');
  if (err === 'too_far') return t('event.tooFar');
  return true;
};

const inputRules = [...(props.rules ?? []), combinedRule];

function toLocalParts(value: string): { date: string; time: string } {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '' };
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

function toIso(datePart: string, timePart: string): string {
  const combined = new Date(`${datePart}T${timePart}`);
  if (Number.isNaN(combined.getTime())) return '';
  return combined.toISOString();
}

function updateModelValue() {
  if (!date.value || !time.value) {
    emit('update:modelValue', '');
    return;
  }

  const iso = toIso(date.value, time.value);
  if (iso && iso.slice(0, 16) !== props.modelValue.slice(0, 16)) {
    emit('update:modelValue', iso);
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      date.value = todayLocalDate();
      time.value = '';
      return;
    }
    const parts = toLocalParts(value);
    date.value = parts.date;
    time.value = parts.time;
  },
  { immediate: true },
);

watch([date, time], updateModelValue);
</script>
