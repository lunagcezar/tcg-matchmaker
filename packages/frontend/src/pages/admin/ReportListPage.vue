<template>
  <q-page class="q-pa-md">
    <AdminPageHeader :title="$t('admin.reports')" />
    <AdminTable :rows="reports" :columns="columns" :loading="loading">
      <template #body-cell-status="{ row }">
        <q-td><StatusBadge :status="(row.status as string) || 'pending'" /></q-td>
      </template>
      <template #body-cell-actions="{ row }">
        <q-td>
          <q-btn
            v-if="(row.status as string) === 'pending'"
            flat
            dense
            icon="check"
            color="positive"
            @click="resolveReport(row.id as string)"
          />
          <q-btn
            v-if="(row.status as string) === 'pending'"
            flat
            dense
            icon="clear"
            color="grey"
            @click="dismissReport(row.id as string)"
          />
        </q-td>
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
import { apiGet, apiPatch } from '@/composables/useApi';

const { t } = useI18n({ useScope: 'global' });

const reports = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const columns = [
  { name: 'target_type', label: t('admin.columns.type'), field: 'target_type' as const },
  { name: 'reason', label: t('admin.columns.reason'), field: 'reason' as const },
  { name: 'status', label: t('admin.columns.status'), field: 'status' as const },
  { name: 'created_at', label: t('admin.columns.date'), field: 'created_at' as const },
  { name: 'actions', label: t('admin.columns.actions'), field: 'actions' as const },
];

async function fetchReports() {
  loading.value = true;
  try {
    const b = await apiGet('/api/reports');
    reports.value = (b.data ?? []) as Record<string, unknown>[];
  } finally {
    loading.value = false;
  }
}

async function resolveReport(id: string) {
  await apiPatch(`/api/reports/${id}`, { status: 'resolved' });
  await fetchReports();
}

async function dismissReport(id: string) {
  await apiPatch(`/api/reports/${id}`, { status: 'dismissed' });
  await fetchReports();
}

onMounted(fetchReports);
</script>
