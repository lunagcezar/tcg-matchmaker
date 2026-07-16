<template>
  <q-page :class="['flex flex-center', pageClass]">
    <div class="app-panel" :style="{ maxWidth: width || '400px', width: '100%' }">
      <div v-if="$slots.title || title" class="app-panel__header">
        <h5 :class="titleClass">{{ title }}</h5>
      </div>
      <div :class="['app-panel__body', bodyClass]">
        <p v-if="error" class="text-negative text-center q-mb-sm">{{ error }}</p>
        <p v-if="success" class="text-positive text-center q-mb-sm">{{ success }}</p>
        <slot />
      </div>
      <div v-if="$slots.actions" class="app-panel__actions">
        <slot name="actions" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    width?: string;
    pageClass?: string;
    bodyClass?: string;
    error?: string;
    success?: string;
    titleClass?: string;
  }>(),
  {
    title: '',
    width: '',
    pageClass: '',
    bodyClass: '',
    error: '',
    success: '',
    titleClass: 'text-center q-my-none',
  },
);
</script>

<style scoped>
.app-panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background-color: var(--card);
  color: var(--card-foreground);
  overflow: hidden;
}

.app-panel__header {
  padding: 1rem 1rem 0;
}

.app-panel__body {
  padding: 1rem;
}

.app-panel__actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
}
</style>
