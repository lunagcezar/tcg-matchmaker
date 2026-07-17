<template>
  <q-page class="q-pa-md">
    <AdminPageHeader
      :title="$t('admin.manageTcgs')"
      action-label="New TCG"
      action-to="/admin/tcgs/create"
    />
    <AdminTable :rows="tcgs" :columns="columns" :loading="loading">
      <template #body-cell-actions="{ row }">
        <q-td>
          <q-btn
            flat
            dense
            icon="category"
            color="primary"
            :to="`/admin/tcgs/${row.id as string}/formats`"
          />
          <q-btn flat dense icon="delete" color="negative" @click="confirmDelete(row)" />
        </q-td>
      </template>
    </AdminTable>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import { apiGet, apiDelete } from '@/composables/useApi';

const $q = useQuasar();
const { t } = useI18n({ useScope: 'global' });

interface TcgRow {
  id: string;
  name: string;
  slug: string;
}

const tcgs = ref<TcgRow[]>([]);
const loading = ref(false);

const columns = [
  { name: 'name', label: 'Name', field: 'name' as const, sortable: true },
  { name: 'slug', label: 'Slug', field: 'slug' as const },
  { name: 'actions', label: 'Actions', field: 'actions' as const },
];

async function fetchTcgs() {
  loading.value = true;
  try {
    const b = await apiGet('/api/tcgs');
    tcgs.value = (b.data ?? []) as TcgRow[];
  } finally {
    loading.value = false;
  }
}

function confirmDelete(row: TcgRow) {
  $q.dialog({
    title: t('common.delete'),
    message: `Delete "${row.name}"? This action cannot be undone.`,
    cancel: t('common.cancel'),
    ok: { label: t('common.delete'), color: 'negative', flat: true },
    persistent: true,
  }).onOk(() => {
    void deleteTcg(row.id);
  });
}

async function deleteTcg(id: string) {
  await apiDelete(`/api/tcgs/${id}`);
  await fetchTcgs();
}

onMounted(fetchTcgs);
</script>
