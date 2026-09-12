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
import { useI18n } from 'vue-i18n';

import StatusBadge from '@/components/atoms/StatusBadge.vue';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import { apiGet } from '@/composables/useApi';
import { useLoadable } from '@/composables/useLoadable';

const { t } = useI18n({ useScope: 'global' });

const { data: stores, loading } = useLoadable(
  () => apiGet('/api/stores').then((b) => (b.data ?? []) as Record<string, unknown>[]),
  [] as Record<string, unknown>[],
);
const columns = [
  { name: 'name', label: t('admin.columns.name'), field: 'name' as const },
  { name: 'status', label: t('admin.columns.status'), field: 'status' as const },
  { name: 'city', label: t('admin.columns.city'), field: 'city' as const },
];
</script>
