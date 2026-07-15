<template>
  <q-page class="q-pa-md">
    <AdminPageHeader title="Audit Log" />
    <AdminTable :rows="entries" :columns="columns" :loading="loading">
      <template #body-cell-action="{ row }">
        <q-td
          ><q-badge color="primary">{{ row.action }}</q-badge></q-td
        >
      </template>
    </AdminTable>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import { apiGet } from '@/composables/useApi';

const entries = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const columns = [
  { name: 'action', label: 'Action', field: 'action' as const },
  { name: 'target_type', label: 'Target', field: 'target_type' as const },
  { name: 'created_at', label: 'Date', field: 'created_at' as const },
];

async function fetchAuditLog() {
  loading.value = true;
  try {
    const b = await apiGet('/api/admin/audit-log');
    entries.value = (b.data ?? []) as Record<string, unknown>[];
  } finally {
    loading.value = false;
  }
}
onMounted(fetchAuditLog);
</script>
