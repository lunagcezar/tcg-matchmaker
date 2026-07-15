<template>
  <q-page class="q-pa-md">
    <AdminPageHeader :title="$t('admin.manageUsers')" />
    <AdminTable :rows="users" :columns="columns" :loading="loading">
      <template #body-cell-role="{ row }">
        <q-td
          ><q-badge :color="row.role === 'admin' ? 'red' : 'primary'">{{ row.role }}</q-badge></q-td
        >
      </template>
      <template #body-cell-status="{ row }">
        <q-td>
          <q-badge v-if="row.banned_at" color="negative">Banned</q-badge>
          <q-badge v-else color="positive">Active</q-badge>
        </q-td>
      </template>
      <template #body-cell-actions="{ row }">
        <q-td>
          <q-btn
            v-if="!row.banned_at"
            flat
            dense
            icon="block"
            color="negative"
            @click="banUser(row.id as string)"
          />
          <q-btn
            v-else
            flat
            dense
            icon="check_circle"
            color="positive"
            @click="unbanUser(row.id as string)"
          />
          <q-btn
            v-if="row.role !== 'admin'"
            flat
            dense
            icon="admin_panel_settings"
            color="warning"
            @click="promoteUser(row.id as string)"
          />
        </q-td>
      </template>
    </AdminTable>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import { apiGet, apiPost } from '@/composables/useApi';

const users = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);
const columns = [
  { name: 'username', label: 'Username', field: 'username' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email' as const },
  { name: 'role', label: 'Role', field: 'role' as const },
  { name: 'status', label: 'Status', field: 'banned_at' as const },
  { name: 'actions', label: 'Actions', field: 'actions' as const },
];

async function fetchUsers() {
  loading.value = true;
  try {
    const b = await apiGet('/api/auth/me');
    users.value = b.data ? [b.data as Record<string, unknown>] : [];
  } finally {
    loading.value = false;
  }
}
async function banUser(id: string) {
  await apiPost(`/api/admin/users/${id}/ban`);
  await fetchUsers();
}
async function unbanUser(id: string) {
  await apiPost(`/api/admin/users/${id}/unban`);
  await fetchUsers();
}
async function promoteUser(id: string) {
  await apiPost(`/api/admin/users/${id}/promote`);
  await fetchUsers();
}
onMounted(fetchUsers);
</script>
