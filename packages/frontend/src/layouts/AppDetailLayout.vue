<template>
  <q-page class="q-py-md">
    <div v-if="item" :style="{ maxWidth: width || '600px' }" class="app-detail">
      <slot />
    </div>
    <div v-else-if="loading" class="text-center q-py-xl">
      <q-spinner size="lg" />
    </div>
    <div v-else-if="showEmpty" class="text-center text-grey q-py-xl">
      <slot name="empty">{{ emptyText || $t('common.noResults') }}</slot>
    </div>
  </q-page>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    item: unknown;
    loading?: boolean;
    width?: string;
    showEmpty?: boolean;
    emptyText?: string;
  }>(),
  {
    loading: false,
    width: '',
    showEmpty: false,
    emptyText: '',
  },
);
</script>

<style scoped>
.app-detail {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background-color: var(--card);
  color: var(--card-foreground);
  padding: 1.5rem;
}
</style>
