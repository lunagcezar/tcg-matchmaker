<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <q-btn flat dense icon="arrow_back" :to="'/admin/tcgs'" class="q-mr-sm" />
        <h5 class="q-my-none">{{ tcgName }}</h5>
      </div>
      <q-btn color="primary" icon="add" label="New Format" @click="showDialog = true" />
    </div>
    <q-table :rows="formats" :columns="columns" row-key="id" :loading="loading" flat bordered />
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 400px">
        <q-card-section><h6>New Format</h6></q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name" label="Name" outlined required />
          <q-input v-model="form.slug" label="Slug" outlined required />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Create" @click="createFormat" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const tcgId = route.params.id as string;
const tcgName = ref('Formats');
const formats = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const form = ref({ name: '', slug: '' });

const columns = [
  { name: 'name', label: 'Name', field: 'name', sortable: true },
  { name: 'slug', label: 'Slug', field: 'slug' },
];

async function fetchFormats() {
  loading.value = true;
  try {
    const res = await fetch(`${apiUrl}/api/tcgs/${tcgId}/formats`);
    const body = await res.json();
    formats.value = body.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function createFormat() {
  saving.value = true;
  try {
    await fetch(`${apiUrl}/api/tcgs/${tcgId}/formats`, {
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
