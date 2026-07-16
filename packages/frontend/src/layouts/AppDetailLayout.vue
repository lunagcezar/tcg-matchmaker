<template>
  <q-page class="q-pa-md flex flex-center">
    <div v-if="item" :style="{ maxWidth: width || '600px' }">
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
