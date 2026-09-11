<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 400px">
      <q-card-section
        ><h6 class="q-my-none">{{ title }}</h6></q-card-section
      >
      <q-card-section class="q-gutter-md">
        <slot />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="cancelLabel" @click="$emit('update:modelValue', false)" />
        <q-btn color="primary" :label="submitLabel" :loading="saving" @click="$emit('submit')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  title: string;
  submitLabel: string;
  saving: boolean;
  cancelLabel?: string;
}>();
defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'submit'): void }>();
</script>
