<template>
  <q-page class="q-pa-md">
    <AdminPageHeader title="Manage Stores" />
    <AdminTable :rows="stores" :columns="columns" :loading="loading">
      <template #body-cell-status="{ row }">
        <q-td><StatusBadge :status="(row.status as string) || 'inactive'" /></q-td>
      </template>
    </AdminTable>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import StatusBadge from '@/components/atoms/StatusBadge.vue';
import { apiGet } from '@/composables/useApi';

const { t } = useI18n({ useScope: 'global' });

const stores = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const columns = [
  { name: 'name', label: t('admin.columns.name'), field: 'name' as const },
  { name: 'status', label: t('admin.columns.status'), field: 'status' as const },
  { name: 'city', label: t('admin.columns.city'), field: 'city' as const },
];

async function fetchStores() {
  loading.value = true;
  try {
    const b = await apiGet('/api/stores');
    stores.value = (b.data ?? []) as Record<string, unknown>[];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchStores);
</script>
