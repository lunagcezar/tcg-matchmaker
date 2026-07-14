<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <h5 class="q-my-none">Reports</h5>
    </div>
    <q-table :rows="reports" :columns="columns" row-key="id" :loading="loading" flat bordered>
      <template #body-cell-status="{ row }">
        <q-td>
          <q-badge :color="row.status === 'pending' ? 'warning' : row.status === 'resolved' ? 'positive' : 'grey'">
            {{ row.status }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-actions="{ row }">
        <q-td>
          <q-btn v-if="row.status === 'pending'" flat dense icon="check" color="positive" @click="resolveReport(row.id as string)" />
          <q-btn v-if="row.status === 'pending'" flat dense icon="clear" color="grey" @click="dismissReport(row.id as string)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const reports = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);

const columns = [
  { name: 'target_type', label: 'Type', field: 'target_type' },
  { name: 'reason', label: 'Reason', field: 'reason' },
  { name: 'status', label: 'Status', field: 'status' },
  { name: 'created_at', label: 'Date', field: 'created_at' },
  { name: 'actions', label: 'Actions', field: 'actions' },
];

async function fetchReports() {
  loading.value = true;
  try {
    const res = await fetch(`${apiUrl}/api/reports`);
    const body = await res.json();
    reports.value = body.data ?? [];
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
