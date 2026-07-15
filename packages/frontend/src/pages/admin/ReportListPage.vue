<template>
  <q-page class="q-pa-md">
    <AdminPageHeader title="Reports" />
    <AdminTable :rows="reports" :columns="columns" :loading="loading">
      <template #body-cell-status="{ row }">
        <q-td>
          <q-badge
            :color="
              row.status === 'pending' ? 'warning' : row.status === 'resolved' ? 'positive' : 'grey'
            "
            >{{ row.status }}</q-badge
          >
        </q-td>
      </template>
      <template #body-cell-actions="{ row }">
        <q-td>
          <q-btn
            v-if="row.status === 'pending'"
            flat
            dense
            icon="check"
            color="positive"
            @click="resolveReport(row.id as string)"
          />
          <q-btn
            v-if="row.status === 'pending'"
            flat
            dense
            icon="clear"
            color="grey"
            @click="dismissReport(row.id as string)"
          />
        </q-td>
      </template>
    </AdminTable>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const reports = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const columns = [
  { name: 'target_type', label: 'Type', field: 'target_type' as const },
  { name: 'reason', label: 'Reason', field: 'reason' as const },
  { name: 'status', label: 'Status', field: 'status' as const },
  { name: 'created_at', label: 'Date', field: 'created_at' as const },
  { name: 'actions', label: 'Actions', field: 'actions' as const },
];

async function fetchReports() {
  loading.value = true;
  try {
    const r = await fetch(`${apiUrl}/api/reports`);
    const b = await r.json();
    reports.value = b.data ?? [];
  } finally {
    loading.value = false;
  }
}
async function resolveReport(id: string) {
  await fetch(`${apiUrl}/api/reports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' }),
  });
  await fetchReports();
}
async function dismissReport(id: string) {
  await fetch(`${apiUrl}/api/reports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'dismissed' }),
  });
  await fetchReports();
}
onMounted(fetchReports);
</script>
