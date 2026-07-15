<template>
  <q-page class="q-pa-md">
    <AdminPageHeader
      title="Formats"
      back-to="/admin/tcgs"
      action-label="New Format"
      @action="showDialog = true"
    />
    <AdminTable :rows="formats" :columns="columns" :loading="loading" />
    <AdminFormDialog
      v-model="showDialog"
      title="New Format"
      submit-label="Create"
      :saving="saving"
      @submit="createFormat"
    >
      <q-input v-model="form.name" label="Name" outlined required />
      <q-input v-model="form.slug" label="Slug" outlined required />
    </AdminFormDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import AdminFormDialog from '@/components/molecules/AdminFormDialog.vue';
import { getApiBase } from '@/lib/api';

const route = useRoute();
const tcgId = route.params.id as string;
const formats = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const form = ref({ name: '', slug: '' });
const columns = [
  { name: 'name', label: 'Name', field: 'name' as const, sortable: true },
  { name: 'slug', label: 'Slug', field: 'slug' as const },
];

async function fetchFormats() {
  loading.value = true;
  try {
    const r = await fetch(`${getApiBase()}/api/tcgs/${tcgId}/formats`);
    const b = await r.json();
    formats.value = b.data ?? [];
  } finally {
    loading.value = false;
  }
}
async function createFormat() {
  saving.value = true;
  try {
    await fetch(`${getApiBase()}/api/tcgs/${tcgId}/formats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form.value, tcg_id: tcgId }),
    });
    showDialog.value = false;
    form.value = { name: '', slug: '' };
    await fetchFormats();
  } finally {
    saving.value = false;
  }
}
onMounted(fetchFormats);
</script>
