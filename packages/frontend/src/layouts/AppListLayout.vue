<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md flex-wrap">
      <h5 class="q-my-none col-12 col-sm-auto">{{ title }}</h5>
      <div class="row q-gutter-sm col-12 col-sm-auto">
        <slot name="actions" />
      </div>
    </div>
    <slot name="filters" />
    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner size="lg" />
    </div>
    <template v-else>
      <slot />
      <div v-if="empty" class="text-center text-grey q-py-xl">
        {{ emptyText || $t('common.noResults') }}
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    loading: boolean;
    empty: boolean;
    emptyText?: string;
  }>(),
  {
    emptyText: '',
  },
);
</script>
