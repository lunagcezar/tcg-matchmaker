<template>
  <div class="row">
    <div class="col-6">
      <q-input
        v-model="date"
        type="date"
        :label="$t('event.date')"
        :rules="rules"
        outlined
        class="date-time-picker__date"
      />
    </div>
    <div class="col-6">
      <q-input
        v-model="time"
        type="time"
        :label="$t('event.time')"
        :rules="rules"
        outlined
        class="date-time-picker__time"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

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

function parseModelValue(value: string) {
  if (!value) {
    date.value = '';
    time.value = '';
    return;
  }

  const [datePart, timePart] = value.split('T');
  date.value = datePart ?? '';
  time.value = timePart ? timePart.slice(0, 5) : '';
}

function updateModelValue() {
  if (!date.value || !time.value) {
    emit('update:modelValue', '');
    return;
  }

  const combined = new Date(`${date.value}T${time.value}`);
  if (Number.isNaN(combined.getTime())) {
    emit('update:modelValue', '');
    return;
  }

  const iso = combined.toISOString();
  if (iso !== props.modelValue) {
    emit('update:modelValue', iso);
  }
}

watch(() => props.modelValue, parseModelValue, { immediate: true });
watch(date, updateModelValue);
watch(time, updateModelValue);
</script>
