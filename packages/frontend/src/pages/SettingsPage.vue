<template>
  <q-page class="flex flex-center q-pa-md">
    <div class="app-panel" style="max-width: 550px; width: 100%">
      <div class="app-panel__header">
        <h5 class="text-center q-my-none">{{ $t('nav.settings') }}</h5>
      </div>
      <q-tabs
        v-model="tab"
        dense
        class="text-primary q-mt-sm"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="profile" :label="$t('settings.tabProfile')" icon="person" />
        <q-tab name="password" :label="$t('settings.tabPassword')" icon="lock" />
        <q-tab name="account" :label="$t('settings.tabAccount')" icon="settings" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="profile">
          <div class="q-gutter-sm">
            <q-input v-model="username" :label="$t('auth.username')" outlined readonly />
            <q-btn
              color="primary"
              :label="$t('common.save')"
              class="full-width"
              :loading="saving"
              @click="saveProfile"
            />
          </div>
        </q-tab-panel>

        <q-tab-panel name="password">
          <div class="q-gutter-sm">
            <q-input
              v-model="currentPassword"
              :label="$t('auth.currentPassword')"
              type="password"
              outlined
            />
            <q-input
              v-model="newPassword"
              :label="$t('auth.newPassword')"
              type="password"
              outlined
              :rules="[
                (val: string) => !val || val.length >= 8 || $t('auth.minLength', { min: 8 }),
              ]"
            />
            <q-input
              v-model="confirmNewPassword"
              :label="$t('auth.confirmPassword')"
              type="password"
              outlined
              :rules="[
                (val: string) => !val || val === newPassword || $t('auth.passwordsDontMatch'),
              ]"
            />
            <q-btn
              color="primary"
              :label="$t('common.save')"
              class="full-width"
              :loading="passwordSaving"
              @click="changePassword"
            />
            <p
              v-if="passwordMessage"
              class="text-center text-caption"
              :class="passwordError ? 'text-negative' : 'text-positive'"
            >
              {{ passwordMessage }}
            </p>
          </div>
        </q-tab-panel>

        <q-tab-panel name="account">
          <div class="q-gutter-sm">
            <q-btn
              color="secondary"
              :label="$t('settings.downloadData')"
              class="full-width"
              :loading="exportLoading"
              @click="handleExport"
            />
            <q-btn
              color="warning"
              :label="$t('settings.suspendAccount')"
              class="full-width"
              :loading="suspendLoading"
              @click="handleSuspend"
            />
            <q-btn
              color="negative"
              :label="$t('settings.deleteAccount')"
              class="full-width"
              :loading="deleteLoading"
              @click="handleDelete"
            />
            <q-separator class="full-width" />
            <q-btn
              color="negative"
              :label="$t('auth.signOut')"
              class="full-width"
              @click="logout"
            />
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { deleteAccount, suspendAccount, exportData } from '@/composables/useAccountManagement';
import { apiGet, apiPatch } from '@/composables/useApi';

usePageMeta({ titleKey: 'meta.settings', descKey: 'meta.settingsDesc' });

const $q = useQuasar();
const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n({ useScope: 'global' });

const tab = ref('profile');
const username = ref('');
const saving = ref(false);

const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const passwordSaving = ref(false);
const passwordMessage = ref('');
const passwordError = ref(false);

const deleteLoading = ref(false);
const suspendLoading = ref(false);
const exportLoading = ref(false);

async function saveProfile() {
  saving.value = true;
  try {
    await apiPatch('/api/auth/profile', { username: username.value });
    $q.notify({ type: 'positive', message: 'Profile updated!' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update profile' });
  } finally {
    saving.value = false;
  }
}

async function changePassword() {
  passwordMessage.value = '';
  passwordError.value = false;
  if (!newPassword.value) {
    passwordMessage.value = 'New password is required';
    passwordError.value = true;
    return;
  }
  if (newPassword.value !== confirmNewPassword.value) {
    passwordMessage.value = 'Passwords do not match';
    passwordError.value = true;
    return;
  }
  passwordSaving.value = true;
  try {
    const { error } = await authStore.updatePassword(newPassword.value);
    if (error) {
      passwordMessage.value = error;
      passwordError.value = true;
    } else {
      passwordMessage.value = 'Password updated successfully';
      passwordError.value = false;
      currentPassword.value = '';
      newPassword.value = '';
      confirmNewPassword.value = '';
    }
  } catch {
    passwordMessage.value = 'Failed to update password';
    passwordError.value = true;
  } finally {
    passwordSaving.value = false;
  }
}

function handleDelete() {
  $q.dialog({
    title: t('settings.deleteAccount'),
    message: t('settings.deleteAccountConfirm'),
    cancel: t('settings.cancel'),
    ok: { label: t('settings.confirmDelete'), color: 'negative', flat: true },
    persistent: true,
  }).onOk(() => {
    void handleDeleteConfirmed();
  });
}

async function handleDeleteConfirmed() {
  deleteLoading.value = true;
  const result = await deleteAccount();
  deleteLoading.value = false;
  if (result.error) {
    $q.notify({ type: 'negative', message: result.error });
  } else {
    $q.notify({ type: 'positive', message: t('settings.accountDeleted') });
    await authStore.signOut();
    void router.push('/');
  }
}

function handleSuspend() {
  $q.dialog({
    title: t('settings.suspendAccount'),
    message: t('settings.suspendAccountConfirm'),
    cancel: t('settings.cancel'),
    ok: { label: t('settings.suspendAccount'), color: 'warning', flat: true },
    persistent: true,
  }).onOk(() => {
    void handleSuspendConfirmed();
  });
}

async function handleSuspendConfirmed() {
  suspendLoading.value = true;
  const result = await suspendAccount();
  suspendLoading.value = false;
  if (result.error) {
    $q.notify({ type: 'negative', message: result.error });
  } else {
    $q.notify({ type: 'positive', message: t('settings.accountSuspended') });
    await authStore.signOut();
    void router.push('/');
  }
}

async function handleExport() {
  exportLoading.value = true;
  const data = await exportData();
  exportLoading.value = false;
  if (!data) {
    $q.notify({ type: 'negative', message: 'Failed to export data' });
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tcg-matchmaker-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  $q.notify({ type: 'positive', message: t('settings.dataExported') });
}

async function logout() {
  await authStore.signOut();
  void router.push('/login');
}

onMounted(async () => {
  username.value = authStore.profile?.username || '';
  if (!username.value) {
    try {
      const j = await apiGet('/api/auth/me');
      if (j.data) {
        username.value = ((j.data as Record<string, unknown>).username as string) || '';
      }
    } catch {
      /* ignore */
    }
  }
});
</script>

<style scoped>
.app-panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background-color: var(--card);
  color: var(--card-foreground);
  overflow: hidden;
}

.app-panel__header {
  padding: 1rem 1rem 0;
}
</style>
