<template>
  <q-card class="app-card" :style="'width: ' + (width || '400px')">
    <q-card-section v-if="$slots.title || title">
      <h5 class="text-center q-my-sm">{{ title }}</h5>
    </q-card-section>
    <q-card-section>
      <slot />
    </q-card-section>
    <q-card-actions v-if="$slots.actions" align="right">
      <slot name="actions" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{ title?: string; width?: string }>();
</script>
