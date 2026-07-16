<template>
  <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" flat>
    <template v-for="(_, slot) in $slots" #[slot]="scope" :key="slot">
      <slot :name="slot" v-bind="scope" />
    </template>
  </q-table>
</template>

<script setup lang="ts">
defineProps<{
  rows: unknown[];
  columns: { name: string; label: string; field: string; sortable?: boolean }[];
  loading: boolean;
}>();
</script>
