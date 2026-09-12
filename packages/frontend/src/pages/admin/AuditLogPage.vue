<template>
  <q-page class="q-pa-md">
    <AdminPageHeader :title="$t('admin.auditLog')" />
    <AdminTable :rows="entries" :columns="columns" :loading="loading">
      <template #body-cell-action="{ row }">
        <q-td
          ><q-badge color="primary">{{ row.action }}</q-badge></q-td
        >
      </template>
    </AdminTable>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import { apiGet } from '@/composables/useApi';
import { useLoadable } from '@/composables/useLoadable';

const { t } = useI18n({ useScope: 'global' });

const { data: entries, loading } = useLoadable(
  () => apiGet('/api/admin/audit-log').then((b) => (b.data ?? []) as Record<string, unknown>[]),
  [] as Record<string, unknown>[],
);
const columns = [
  { name: 'action', label: t('admin.columns.actions'), field: 'action' as const },
  { name: 'target_type', label: t('admin.columns.target'), field: 'target_type' as const },
  { name: 'created_at', label: t('admin.columns.date'), field: 'created_at' as const },
];
</script>
