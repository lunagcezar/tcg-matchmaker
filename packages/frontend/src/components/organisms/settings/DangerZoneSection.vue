<template>
  <div class="q-gutter-sm">
    <q-btn
      color="secondary"
      :label="$t('settings.downloadData')"
      class="full-width"
      :loading="exportLoading"
      @click="$emit('export')"
    />
    <q-btn
      color="warning"
      :label="$t('settings.suspendAccount')"
      class="full-width"
      :loading="suspendLoading"
      @click="suspendDialog = true"
    />
    <q-btn
      color="negative"
      :label="$t('settings.deleteAccount')"
      class="full-width"
      :loading="deleteLoading"
      @click="deleteDialog = true"
    />
    <q-separator class="full-width" />
    <q-btn
      color="negative"
      :label="$t('auth.signOut')"
      class="full-width"
      @click="$emit('logout')"
    />

    <ConfirmDeleteDialog
      v-model="deleteDialog"
      :title="$t('settings.deleteAccount')"
      :message="$t('settings.deleteAccountConfirm')"
      :confirm-label="$t('settings.confirmDelete')"
      confirm-color="negative"
      @confirm="$emit('delete')"
    />
    <ConfirmDeleteDialog
      v-model="suspendDialog"
      :title="$t('settings.suspendAccount')"
      :message="$t('settings.suspendAccountConfirm')"
      :confirm-label="$t('settings.suspendAccount')"
      confirm-color="warning"
      @confirm="$emit('suspend')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ConfirmDeleteDialog from '@/components/molecules/ConfirmDeleteDialog.vue';

interface Props {
  deleteLoading: boolean;
  suspendLoading: boolean;
  exportLoading: boolean;
}

defineProps<Props>();
defineEmits<{
  (e: 'delete'): void;
  (e: 'suspend'): void;
  (e: 'export'): void;
  (e: 'logout'): void;
}>();

const deleteDialog = ref(false);
const suspendDialog = ref(false);
</script>
