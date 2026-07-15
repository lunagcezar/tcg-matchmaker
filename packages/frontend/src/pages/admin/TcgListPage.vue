<template>
  <q-page class="q-pa-md">
    <AdminPageHeader :title="$t('admin.manageTcgs')" action-label="New TCG" @action="showDialog = true" />
    <AdminTable :rows="tcgs" :columns="columns" :loading="loading">
      <template #body-cell-actions="{ row }">
        <q-td>
          <q-btn flat dense icon="category" color="primary" :to="`/admin/tcgs/${row.id}/formats`" />
          <q-btn flat dense icon="delete" color="negative" @click="deleteTcg(row.id as string)" />
        </q-td>
      </template>
    </AdminTable>
    <AdminFormDialog v-model="showDialog" title="New TCG" submit-label="Create" :saving="saving" @submit="createTcg">
      <q-input v-model="form.name" label="Name" outlined required />
      <q-input v-model="form.slug" label="Slug" outlined required hint="URL-friendly identifier" />
    </AdminFormDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import AdminFormDialog from '@/components/molecules/AdminFormDialog.vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const tcgs = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const form = ref({ name: '', slug: '' });

const columns = [
  { name: 'name', label: 'Name', field: 'name' as const, sortable: true },
  { name: 'slug', label: 'Slug', field: 'slug' as const },
  { name: 'actions', label: 'Actions', field: 'actions' as const },
];

async function fetchTcgs() {
  loading.value = true;
  try { const r = await fetch(`${apiUrl}/api/tcgs`); const b = await r.json(); tcgs.value = b.data ?? []; } finally { loading.value = false; }
}
async function createTcg() {
  saving.value = true;
  try {
    await fetch(`${apiUrl}/api/tcgs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form.value) });
    showDialog.value = false; form.value = { name: '', slug: '' }; await fetchTcgs();
  } finally { saving.value = false; }
}
async function deleteTcg(id: string) { await fetch(`${apiUrl}/api/tcgs/${id}`, { method: 'DELETE' }); await fetchTcgs(); }
onMounted(fetchTcgs);
</script>
