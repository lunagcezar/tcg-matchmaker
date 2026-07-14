<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <h5 class="q-my-none">Audit Log</h5>
    </div>
    <q-table :rows="entries" :columns="columns" row-key="id" :loading="loading" flat bordered>
      <template #body-cell-action="{ row }">
        <q-td><q-badge color="primary">{{ row.action }}</q-badge></q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const entries = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);

const columns = [
  { name: 'action', label: 'Action', field: 'action' },
  { name: 'target_type', label: 'Target', field: 'target_type' },
  { name: 'created_at', label: 'Date', field: 'created_at' },
];

async function fetchAuditLog() {
  loading.value = true;
  try {
    const res = await fetch(`${apiUrl}/api/admin/audit-log`);
    const body = await res.json();
    entries.value = body.data ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAuditLog);
</script>
