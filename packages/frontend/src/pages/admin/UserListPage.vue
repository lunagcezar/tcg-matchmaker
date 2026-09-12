<template>
  <q-page class="q-pa-md">
    <AdminPageHeader :title="$t('admin.manageUsers')" />
    <AdminTable :rows="users" :columns="columns" :loading="loading">
      <template #body-cell-role="{ row }">
        <q-td>
          <q-badge :color="roleColor(row.role)">{{ row.role }}</q-badge>
        </q-td>
      </template>
      <template #body-cell-status="{ row }">
        <q-td>
          <StatusBadge :status="row.banned_at ? 'banned' : 'active'" />
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
            @click="openDialog('ban', row)"
          />
          <q-btn
            v-else
            flat
            dense
            icon="check_circle"
            color="positive"
            @click="openDialog('unban', row)"
          />
          <q-btn
            v-if="row.role !== 'admin'"
            flat
            dense
            icon="admin_panel_settings"
            color="warning"
            @click="openDialog('promote', row)"
          />
        </q-td>
      </template>
    </AdminTable>
    <ConfirmDeleteDialog
      v-model="showDialog"
      :title="dialogTitle"
      :message="dialogMessage"
      :confirm-label="dialogLabel"
      :confirm-color="dialogColor"
      @confirm="runAction"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import StatusBadge from '@/components/atoms/StatusBadge.vue';
import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AdminTable from '@/components/molecules/AdminTable.vue';
import ConfirmDeleteDialog from '@/components/molecules/ConfirmDeleteDialog.vue';
import { apiGet, apiPost } from '@/composables/useApi';
import { useLoadable } from '@/composables/useLoadable';
import { roleColor } from '@/lib/colors';

const { t } = useI18n({ useScope: 'global' });

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  banned_at: string | null;
}

const {
  data: users,
  loading,
  load,
} = useLoadable(
  () => apiGet('/api/admin/users').then((b) => (b.data ?? []) as UserRow[]),
  [] as UserRow[],
);
const showDialog = ref(false);
const dialogTitle = ref('');
const dialogMessage = ref('');
const dialogLabel = ref('');
const dialogColor = ref('');
const selectedId = ref<string | null>(null);
const selectedAction = ref<'ban' | 'unban' | 'promote' | null>(null);

const columns = [
  { name: 'username', label: t('auth.username'), field: 'username' as const, sortable: true },
  { name: 'email', label: t('auth.email'), field: 'email' as const },
  { name: 'role', label: t('profile.role'), field: 'role' as const },
  { name: 'status', label: t('event.status'), field: 'banned_at' as const },
  { name: 'actions', label: t('admin.columns.actions'), field: 'actions' as const },
];

function openDialog(action: 'ban' | 'unban' | 'promote', row: UserRow) {
  selectedAction.value = action;
  selectedId.value = row.id;
  if (action === 'ban') {
    dialogTitle.value = t('admin.ban');
    dialogMessage.value = t('admin.banConfirm', { name: row.username });
    dialogLabel.value = t('admin.ban');
    dialogColor.value = 'negative';
  } else if (action === 'unban') {
    dialogTitle.value = t('admin.unban');
    dialogMessage.value = t('admin.unbanConfirm', { name: row.username });
    dialogLabel.value = t('admin.unban');
    dialogColor.value = 'positive';
  } else {
    dialogTitle.value = t('admin.promote');
    dialogMessage.value = t('admin.promoteConfirm', { name: row.username });
    dialogLabel.value = t('admin.promote');
    dialogColor.value = 'warning';
  }
  showDialog.value = true;
}

async function runAction() {
  if (!selectedId.value || !selectedAction.value) return;
  await apiPost(`/api/admin/users/${selectedId.value}/${selectedAction.value}`);
  showDialog.value = false;
  selectedId.value = null;
  selectedAction.value = null;
  await load();
}
</script>
