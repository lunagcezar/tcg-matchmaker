<template>
  <q-dialog :model-value="modelValue" @update:model-value="onUpdate">
    <q-card class="confirm-delete-dialog">
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ message }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="$t('common.cancel')" color="primary" @click="onCancel" />
        <q-btn flat :label="confirmLabel" :color="confirmColor" @click="onConfirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
export interface ConfirmDeleteDialogProps {
  modelValue: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  confirmColor?: string;
}

withDefaults(defineProps<ConfirmDeleteDialogProps>(), {
  title: 'Confirm Delete',
  message: 'Are you sure you want to delete this? This action cannot be undone.',
  confirmLabel: 'Delete',
  confirmColor: 'negative',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function onUpdate(value: boolean) {
  emit('update:modelValue', value);
  if (!value) {
    emit('cancel');
  }
}

function onCancel() {
  emit('update:modelValue', false);
  emit('cancel');
}

function onConfirm() {
  emit('confirm');
}
</script>
