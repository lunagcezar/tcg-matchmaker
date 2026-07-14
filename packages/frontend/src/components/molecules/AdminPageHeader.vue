<template>
  <div class="row items-center justify-between q-mb-md">
    <div class="row items-center">
      <q-btn v-if="backTo" flat dense icon="arrow_back" :to="backTo" class="q-mr-sm" />
      <h5 class="q-my-none">{{ title }}</h5>
    </div>
    <q-btn v-if="actionLabel" color="primary" icon="add" :label="actionLabel" @click="$emit('action')" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; actionLabel?: string; backTo?: string }>();
defineEmits<{ action: [] }>();
</script>
