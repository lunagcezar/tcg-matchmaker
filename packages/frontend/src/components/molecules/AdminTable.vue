<template>
  <div class="admin-table-wrap">
    <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" flat>
      <template v-for="(_, slot) in $slots" #[slot]="scope" :key="slot">
        <slot :name="slot" v-bind="scope" />
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  rows: unknown[];
  columns: { name: string; label: string; field: string; sortable?: boolean }[];
  loading: boolean;
}>();
</script>

<style scoped>
.admin-table-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.admin-table-wrap :deep(.q-table) {
  background: transparent;
}

.admin-table-wrap :deep(.q-table thead tr th) {
  text-align: left;
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted-foreground);
  border-bottom: 1px solid var(--border);
}

.admin-table-wrap :deep(.q-table tbody tr td) {
  border-bottom: 1px solid var(--border);
}

.admin-table-wrap :deep(.q-table tbody tr:last-child td) {
  border-bottom: none;
}

.admin-table-wrap :deep(.q-table .q-td--actions) {
  text-align: right;
}
</style>
