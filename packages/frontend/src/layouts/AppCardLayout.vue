<template>
  <q-page :class="['flex flex-center', pageClass]">
    <div class="app-panel" :style="{ maxWidth: width || '400px', width: '100%' }">
      <div v-if="$slots.title || title" class="app-panel__header">
        <h5 :class="titleClass">{{ title }}</h5>
      </div>
      <div v-if="error || success" class="app-panel__notifications">
        <q-chip
          v-if="error"
          icon="error"
          color="negative"
          text-color="white"
          class="q-ma-none"
          square
        >
          {{ error }}
        </q-chip>
        <q-chip
          v-if="success"
          icon="check_circle"
          color="positive"
          text-color="white"
          class="q-ma-none"
          square
        >
          {{ success }}
        </q-chip>
      </div>
      <div :class="['app-panel__body', bodyClass]">
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

.app-panel__notifications {
  padding: 0.5rem 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
