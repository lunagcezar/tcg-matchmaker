<template>
  <q-page :class="pageClass">
    <q-card :style="{ maxWidth: width || '400px' }">
      <q-card-section v-if="$slots.title || title" class="q-pb-none">
        <h5 :class="titleClass">{{ title }}</h5>
      </q-card-section>
      <q-card-section :class="bodyClass">
        <p v-if="error" class="text-negative text-center q-mb-sm">{{ error }}</p>
        <p v-if="success" class="text-positive text-center q-mb-sm">{{ success }}</p>
        <slot />
      </q-card-section>
      <q-card-actions v-if="$slots.actions" align="center">
        <slot name="actions" />
      </q-card-actions>
    </q-card>
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
