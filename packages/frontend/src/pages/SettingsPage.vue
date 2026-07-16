<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 500px">
      <q-card-section
        ><h5 class="q-my-none">{{ $t('nav.settings') }}</h5></q-card-section
      >
      <q-card-section class="q-gutter-sm">
        <q-input v-model="displayName" :label="$t('auth.displayName')" outlined />
        <q-btn
          color="primary"
          :label="$t('common.save')"
          class="full-width"
          :loading="saving"
          @click="saveProfile"
        />
        <q-separator />
        <q-select
          v-model="locale"
          :options="locales"
          :label="$t('common.language')"
          outlined
          emit-value
          map-options
          @update:model-value="changeLocale"
        />
        <q-toggle
          v-model="darkMode"
          :label="$t('common.darkMode')"
          @update:model-value="toggleDark"
        />
        <q-separator />
        <q-toggle
          v-model="pushEnabled"
          :label="$t('notifications.enablePush')"
          :disable="!pushSupported"
          @update:model-value="togglePush"
        />
        <p v-if="pushStatus" class="text-caption text-grey">{{ pushStatus }}</p>
        <q-separator />
        <div class="text-negative text-h6 q-mb-sm">{{ $t('settings.dangerZone') }}</div>
        <div class="flex q-gutter-sm">
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
          <q-btn color="negative" :label="$t('auth.signOut')" class="full-width" @click="logout" />
        </div>
        <p v-if="message" class="text-center text-positive">{{ message }}</p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { deleteAccount, suspendAccount, exportData } from '@/composables/useAccountManagement';
import { apiGet, apiPatch } from '@/composables/useApi';

usePageMeta({ titleKey: 'meta.settings', descKey: 'meta.settingsDesc' });

const $q = useQuasar();
const authStore = useAuthStore();
const appStore = useAppStore();
const router = useRouter();
const { locale: i18nLocale, t } = useI18n({ useScope: 'global' });
const displayName = ref('');
const saving = ref(false);
const message = ref('');
const locale = ref(appStore.locale);
const darkMode = ref(appStore.darkMode);
const pushEnabled = ref(false);
const pushStatus = ref('');
const pushSupported = 'PushManager' in window && 'serviceWorker' in navigator;
const deleteLoading = ref(false);
const suspendLoading = ref(false);
const exportLoading = ref(false);

const locales = [
  { label: 'English', value: 'en-US' },
  { label: 'Português (Brasil)', value: 'pt-BR' },
];

function changeLocale(val: string) {
  i18nLocale.value = val;
  appStore.setLocale(val);
}
function toggleDark() {
  appStore.toggleDarkMode();
}

async function saveProfile() {
  saving.value = true;
  message.value = '';
  try {
    await apiPatch('/api/auth/profile', { display_name: displayName.value });
    message.value = 'Profile updated!';
  } catch {
    message.value = 'Failed to update profile';
  } finally {
    saving.value = false;
  }
}

async function togglePush(val: boolean) {
  if (val) {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        pushStatus.value = 'Push permission denied';
        pushEnabled.value = false;
        return;
      }
      pushStatus.value = 'Push notifications enabled (VAPID keys required for delivery)';
    } catch {
      pushStatus.value = 'Push notification setup failed';
      pushEnabled.value = false;
    }
  } else {
    pushStatus.value = '';
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
  try {
    const j = await apiGet('/api/auth/me');
    if (j.data)
      displayName.value = ((j.data as Record<string, unknown>).display_name as string) || '';
  } catch {
    /* ignore */
  }
});
</script>
