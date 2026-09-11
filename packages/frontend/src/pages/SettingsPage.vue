<template>
  <q-page class="flex flex-center q-pa-md">
    <AppCard width="550px" body-class="q-pa-none">
      <template #title>
        <h5 class="text-center q-my-none">{{ $t('nav.settings') }}</h5>
      </template>
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
          <ProfileSettingsSection
            v-model="username"
            :saving="saving"
            :message="profileMessage"
            :error="profileError"
            @save="saveProfile"
          />
        </q-tab-panel>

        <q-tab-panel name="password">
          <PasswordSettingsSection
            :saving="passwordSaving"
            :message="passwordMessage"
            :error="passwordError"
            @save="changePassword"
          />
        </q-tab-panel>

        <q-tab-panel name="account">
          <DangerZoneSection
            :delete-loading="deleteLoading"
            :suspend-loading="suspendLoading"
            :export-loading="exportLoading"
            @delete="handleDeleteConfirmed"
            @suspend="handleSuspendConfirmed"
            @export="handleExport"
            @logout="void authStore.signOut().then(() => router.push('/login'))"
          />
        </q-tab-panel>
      </q-tab-panels>
    </AppCard>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref, onMounted, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppCard from '@/components/molecules/AppCard.vue';
import DangerZoneSection from '@/components/organisms/settings/DangerZoneSection.vue';
import PasswordSettingsSection from '@/components/organisms/settings/PasswordSettingsSection.vue';
import ProfileSettingsSection from '@/components/organisms/settings/ProfileSettingsSection.vue';
import { deleteAccount, suspendAccount, exportData } from '@/composables/useAccountManagement';
import { apiGet, apiPatch } from '@/composables/useApi';
import { usePageMeta } from '@/composables/usePageMeta';
import { useAuthStore } from '@/stores/useAuthStore';

usePageMeta({ titleKey: 'meta.settings', descKey: 'meta.settingsDesc' });

const $q = useQuasar();
const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n({ useScope: 'global' });

const tab = ref('profile');
const username = ref('');
const saving = ref(false);
const profileMessage = ref('');
const profileError = ref(false);

const passwordSaving = ref(false);
const passwordMessage = ref('');
const passwordError = ref(false);

const deleteLoading = ref(false);
const suspendLoading = ref(false);
const exportLoading = ref(false);

async function saveProfile() {
  profileMessage.value = '';
  profileError.value = false;
  saving.value = true;
  try {
    const result = await apiPatch('/api/auth/profile', { username: username.value });
    if (result.error) {
      profileMessage.value = result.error;
      profileError.value = true;
    } else {
      profileMessage.value = 'Profile updated!';
      profileError.value = false;
      if (authStore.profile) {
        authStore.profile = { ...authStore.profile, username: username.value };
      }
    }
  } catch {
    profileMessage.value = 'Failed to update profile';
    profileError.value = true;
  } finally {
    saving.value = false;
  }
}

async function changePassword(newPassword: string) {
  passwordMessage.value = '';
  passwordError.value = false;
  passwordSaving.value = true;
  try {
    const { error } = await authStore.updatePassword(newPassword);
    if (error) {
      passwordMessage.value = error;
      passwordError.value = true;
    } else {
      passwordMessage.value = 'Password updated successfully';
      passwordError.value = false;
    }
  } catch {
    passwordMessage.value = 'Failed to update password';
    passwordError.value = true;
  } finally {
    passwordSaving.value = false;
  }
}

async function runAccountAction(
  loading: Ref<boolean>,
  action: () => Promise<{ error?: string }>,
  successMessage: string,
) {
  loading.value = true;
  const result = await action();
  loading.value = false;
  if (result.error) {
    $q.notify({ type: 'negative', message: result.error });
    return;
  }
  $q.notify({ type: 'positive', message: successMessage });
  await authStore.signOut();
  void router.push('/');
}

async function handleDeleteConfirmed() {
  await runAccountAction(deleteLoading, deleteAccount, t('settings.accountDeleted'));
}

async function handleSuspendConfirmed() {
  await runAccountAction(suspendLoading, suspendAccount, t('settings.accountSuspended'));
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

<style scoped></style>
