<template>
  <router-link :to="to" class="event-row">
    <slot />
  </router-link>
</template>

<script setup lang="ts">
interface Props {
  to: string;
}

defineProps<Props>();
</script>

<style scoped>
.event-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border);
  color: var(--foreground);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease;
}

.event-row:hover {
  background-color: var(--muted);
}

.event-row:first-child {
  border-top: 1px solid var(--border);
}
</style>
