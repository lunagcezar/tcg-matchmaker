<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-my-none">Manage TCGs</h5>
      <q-btn color="primary" icon="add" label="New TCG" @click="showDialog = true" />
    </div>
    <q-table :rows="tcgs" :columns="columns" row-key="id" :loading="loading" flat bordered>
      <template #body-cell-actions="{ row }">
        <q-td>
          <q-btn flat dense icon="category" color="primary" :to="`/admin/tcgs/${row.id}/formats`" />
          <q-btn flat dense icon="delete" color="negative" @click="deleteTcg(row.id)" />
        </q-td>
      </template>
    </q-table>
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 400px">
        <q-card-section><h6>New TCG</h6></q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name" label="Name" outlined required />
          <q-input v-model="form.slug" label="Slug" outlined required hint="URL-friendly identifier" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Create" @click="createTcg" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const tcgs = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const form = ref({ name: '', slug: '' });

const columns = [
  { name: 'name', label: 'Name', field: 'name', sortable: true },
  { name: 'slug', label: 'Slug', field: 'slug' },
  { name: 'actions', label: 'Actions', field: 'actions' },
];

async function fetchTcgs() {
  loading.value = true;
  try {
    const res = await fetch(`${apiUrl}/api/tcgs`);
    const body = await res.json();
    tcgs.value = body.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function createTcg() {
  saving.value = true;
  try {
    await fetch(`${apiUrl}/api/tcgs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    });
    showDialog.value = false;
    form.value = { name: '', slug: '' };
    await fetchTcgs();
  } finally {
    saving.value = false;
  }
}

async function deleteTcg(id: string) {
  await fetch(`${apiUrl}/api/tcgs/${id}`, { method: 'DELETE' });
  await fetchTcgs();
}

onMounted(fetchTcgs);
</script>
