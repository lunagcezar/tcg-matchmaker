<template>
  <q-page class="q-pa-md">
    <AdminPageHeader
      :title="$t('admin.newFormat')"
      back-to="/admin/tcgs"
      action-label="New Format"
      @action="showDialog = true"
    />
    <AdminTable :rows="formats" :columns="columns" :loading="loading" />
    <AdminFormDialog
      v-model="showDialog"
      :title="$t('admin.newFormat')"
      submit-label="Create"
      :saving="saving"
      @submit="createFormat"
    >
      <q-input v-model="form.name" :label="$t('admin.columns.name')" outlined required />
      <q-input v-model="form.slug" :label="$t('admin.columns.slug')" outlined required />
    </AdminFormDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import AdminFormDialog from '@/components/molecules/AdminFormDialog.vue';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import { apiGet, apiPost } from '@/composables/useApi';
import { useLoadable } from '@/composables/useLoadable';

const { t } = useI18n({ useScope: 'global' });

const route = useRoute();
const tcgId = route.params.id as string;
const {
  data: formats,
  loading,
  load,
} = useLoadable(
  () =>
    apiGet(`/api/tcgs/${tcgId}/formats`).then((b) => (b.data ?? []) as Record<string, unknown>[]),
  [] as Record<string, unknown>[],
);
const saving = ref(false);
const showDialog = ref(false);
const form = ref({ name: '', slug: '' });
const columns = [
  { name: 'name', label: t('admin.columns.name'), field: 'name' as const, sortable: true },
  { name: 'slug', label: t('admin.columns.slug'), field: 'slug' as const },
];

async function createFormat() {
  saving.value = true;
  try {
    await apiPost(`/api/tcgs/${tcgId}/formats`, { ...form.value, tcg_id: tcgId });
    showDialog.value = false;
    form.value = { name: '', slug: '' };
    await load();
  } finally {
    saving.value = false;
  }
}
</script>
