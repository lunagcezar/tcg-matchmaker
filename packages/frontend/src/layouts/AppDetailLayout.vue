<template>
  <q-page>
    <div v-if="item">
      <slot />
    </div>
    <div v-else-if="loading" class="text-center">
      <q-spinner size="lg" />
    </div>
    <div v-else-if="showEmpty" class="text-center text-grey">
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
