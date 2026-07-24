<template>
  <q-btn-toggle
    v-model="model"
    :options="options"
    spread
    outline
    rounded
    :multiple="Array.isArray(props.modelValue)"
    class="filter-toggle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Option {
  label: string;
  value: string;
}

const props = defineProps<{ modelValue: string | string[]; options: Option[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string | string[]): void }>();

const model = computed({
  get: () => props.modelValue,
  set: (value: string | string[]) => emit('update:modelValue', value),
});
</script>

<style scoped>
.filter-toggle {
  flex: 1 1 auto;
  min-width: 360px;
}
</style>
