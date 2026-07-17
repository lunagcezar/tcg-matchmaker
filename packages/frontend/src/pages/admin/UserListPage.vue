<template>
  <q-page class="q-pa-md">
    <AdminPageHeader :title="$t('admin.manageUsers')" />
    <AdminTable :rows="users" :columns="columns" :loading="loading">
      <template #body-cell-role="{ row }">
        <q-td>
          <q-badge :color="(row.role as string) === 'admin' ? 'red' : 'primary'">{{
            row.role
          }}</q-badge>
        </q-td>
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
            @click="confirmBan(row)"
          />
          <q-btn
            v-else
            flat
            dense
            icon="check_circle"
            color="positive"
            @click="confirmUnban(row)"
          />
          <q-btn
            v-if="(row.role as string) !== 'admin'"
            flat
            dense
            icon="admin_panel_settings"
            color="warning"
            @click="confirmPromote(row)"
          />
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
import { apiGet, apiPost } from '@/composables/useApi';

const $q = useQuasar();
const { t } = useI18n({ useScope: 'global' });

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  banned_at: string | null;
}

const users = ref<UserRow[]>([]);
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
    const b = await apiGet('/api/admin/users');
    users.value = (b.data ?? []) as UserRow[];
  } finally {
    loading.value = false;
  }
}

function confirmBan(row: UserRow) {
  $q.dialog({
    title: t('admin.ban'),
    message: `Ban "${row.username}"? They will be unable to log in or participate in events.`,
    cancel: t('common.cancel'),
    ok: { label: t('admin.ban'), color: 'negative', flat: true },
    persistent: true,
  }).onOk(() => {
    void banUser(row.id);
  });
}

function confirmUnban(row: UserRow) {
  $q.dialog({
    title: t('admin.unban'),
    message: `Unban "${row.username}"? They will regain access to their account.`,
    cancel: t('common.cancel'),
    ok: { label: t('admin.unban'), color: 'positive', flat: true },
    persistent: true,
  }).onOk(() => {
    void unbanUser(row.id);
  });
}

function confirmPromote(row: UserRow) {
  $q.dialog({
    title: t('admin.promote'),
    message: `Promote "${row.username}" to admin? They will gain full administrative access.`,
    cancel: t('common.cancel'),
    ok: { label: t('admin.promote'), color: 'warning', flat: true },
    persistent: true,
  }).onOk(() => {
    void promoteUser(row.id);
  });
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
