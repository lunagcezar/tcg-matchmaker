<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <h5 class="q-my-none">Manage Users</h5>
    </div>
    <q-table :rows="users" :columns="columns" row-key="id" :loading="loading" flat bordered>
      <template #body-cell-role="{ row }">
        <q-td><q-badge :color="row.role === 'admin' ? 'red' : 'primary'">{{ row.role }}</q-badge></q-td>
      </template>
      <template #body-cell-status="{ row }">
        <q-td>
          <q-badge v-if="row.banned_at" color="negative">Banned</q-badge>
          <q-badge v-else color="positive">Active</q-badge>
        </q-td>
      </template>
      <template #body-cell-actions="{ row }">
        <q-td>
          <q-btn v-if="!row.banned_at" flat dense icon="block" color="negative" @click="banUser(row.id as string)" />
          <q-btn v-else flat dense icon="check_circle" color="positive" @click="unbanUser(row.id as string)" />
          <q-btn v-if="row.role !== 'admin'" flat dense icon="admin_panel_settings" color="warning" @click="promoteUser(row.id as string)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const users = ref<Array<Record<string, unknown>>>([]);
const loading = ref(false);

const columns = [
  { name: 'username', label: 'Username', field: 'username', sortable: true },
  { name: 'email', label: 'Email', field: 'email' },
  { name: 'role', label: 'Role', field: 'role' },
  { name: 'status', label: 'Status', field: 'banned_at' },
  { name: 'actions', label: 'Actions', field: 'actions' },
];

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await fetch(`${apiUrl}/api/auth/me`);
    const me = await res.json();
    users.value = me.data ? [me.data] : [];
  } finally {
    loading.value = false;
  }
}

async function banUser(id: string) {
  await fetch(`${apiUrl}/api/admin/users/${id}/ban`, { method: 'POST' });
  await fetchUsers();
}

async function unbanUser(id: string) {
  await fetch(`${apiUrl}/api/admin/users/${id}/unban`, { method: 'POST' });
  await fetchUsers();
}

async function promoteUser(id: string) {
  await fetch(`${apiUrl}/api/admin/users/${id}/promote`, { method: 'POST' });
  await fetchUsers();
}

onMounted(fetchUsers);
</script>
