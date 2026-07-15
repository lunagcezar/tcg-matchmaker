<template>
  <q-page class="q-pa-md">
    <AdminPageHeader title="Manage Stores" />
    <AdminTable :rows="stores" :columns="columns" :loading="loading">
      <template #body-cell-status="{ row }">
        <q-td
          ><q-badge :color="row.status === 'active' ? 'positive' : 'negative'">{{
            row.status
          }}</q-badge></q-td
        >
      </template>
    </AdminTable>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const stores = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const columns = [
  { name: 'name', label: 'Name', field: 'name' as const },
  { name: 'status', label: 'Status', field: 'status' as const },
  { name: 'city', label: 'City', field: 'city' as const },
];

async function fetchStores() {
  loading.value = true;
  try {
    const r = await fetch(`${apiUrl}/api/stores`);
    const b = await r.json();
    stores.value = b.data ?? [];
  } finally {
    loading.value = false;
  }
}
onMounted(fetchStores);
</script>
