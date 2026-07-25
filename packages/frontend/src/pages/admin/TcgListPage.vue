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
          <q-btn flat dense icon="delete" color="negative" @click="openDelete(row)" />
        </q-td>
      </template>
    </AdminTable>
    <ConfirmDeleteDialog
      v-model="showDialog"
      :title="$t('common.delete')"
      :message="deleteMessage"
      :confirm-label="$t('common.delete')"
      confirm-color="negative"
      @confirm="deleteSelected"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import ConfirmDeleteDialog from '@/components/molecules/ConfirmDeleteDialog.vue';
import { apiGet, apiDelete } from '@/composables/useApi';

const { t } = useI18n({ useScope: 'global' });

interface TcgRow {
  id: string;
  name: string;
  slug: string;
}

const tcgs = ref<TcgRow[]>([]);
const loading = ref(false);
const showDialog = ref(false);
const deleteMessage = ref('');
const selectedId = ref<string | null>(null);

const columns = [
  { name: 'name', label: t('admin.columns.name'), field: 'name' as const, sortable: true },
  { name: 'slug', label: t('admin.columns.slug'), field: 'slug' as const },
  { name: 'actions', label: t('admin.columns.actions'), field: 'actions' as const },
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

function openDelete(row: TcgRow) {
  deleteMessage.value = t('admin.deleteConfirm', { name: row.name });
  selectedId.value = row.id;
  showDialog.value = true;
}

async function deleteSelected() {
  if (!selectedId.value) return;
  await apiDelete(`/api/tcgs/${selectedId.value}`);
  showDialog.value = false;
  selectedId.value = null;
  await fetchTcgs();
}

onMounted(fetchTcgs);
</script>
