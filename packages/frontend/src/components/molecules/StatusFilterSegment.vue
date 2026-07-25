<template>
  <q-btn-toggle v-model="model" :options="options" spread outline rounded class="filter-segment" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface StatusFilterOption {
  label: string;
  value: string;
  icon?: string;
}

export interface StatusFilterSegmentProps {
  modelValue: string;
  options: StatusFilterOption[];
}

const props = defineProps<StatusFilterSegmentProps>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});
</script>

<style scoped>
.filter-segment {
  flex: 1 1 auto;
  min-width: 260px;
}

@media (max-width: 480px) {
  .filter-segment {
    min-width: 100%;
  }
}
</style>
