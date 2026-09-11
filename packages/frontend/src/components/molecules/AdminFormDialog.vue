<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <AppPanelCard :title="title" actions-align="right">
      <q-card-section class="q-gutter-md">
        <slot />
      </q-card-section>
      <template #actions>
        <q-btn flat :label="cancelLabel" @click="$emit('update:modelValue', false)" />
        <q-btn color="primary" :label="submitLabel" :loading="saving" @click="$emit('submit')" />
      </template>
    </AppPanelCard>
  </q-dialog>
</template>

<script setup lang="ts">
import AppPanelCard from '@/components/molecules/cards/AppPanelCard.vue';

defineProps<{
  modelValue: boolean;
  title: string;
  submitLabel: string;
  saving: boolean;
  cancelLabel?: string;
}>();
defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'submit'): void }>();
</script>
