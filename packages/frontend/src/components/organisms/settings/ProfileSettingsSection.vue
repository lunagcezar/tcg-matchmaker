<template>
  <div class="q-gutter-sm">
    <q-input
      :model-value="modelValue"
      :label="$t('auth.username')"
      outlined
      @update:model-value="$emit('update:modelValue', $event as string)"
    />
    <q-btn
      color="primary"
      :label="$t('common.save')"
      class="full-width"
      :loading="saving"
      @click="$emit('save')"
    />
    <p
      v-if="message"
      class="text-center text-caption"
      :class="error ? 'text-negative' : 'text-positive'"
    >
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string;
  saving: boolean;
  message: string;
  error: boolean;
}

defineProps<Props>();
defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'save'): void;
}>();
</script>
