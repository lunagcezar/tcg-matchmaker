<template>
  <q-page class="q-pa-md row justify-center">
    <q-card style="width: 500px">
      <q-card-section><h5 class="q-my-none">{{ $t('nav.settings') }}</h5></q-card-section>
      <q-card-section class="q-gutter-md">
        <q-input v-model="displayName" :label="$t('auth.displayName')" outlined />
        <q-btn color="primary" :label="$t('common.save')" class="full-width" :loading="saving" @click="saveProfile" />
        <q-separator />
        <q-select v-model="locale" :options="locales" :label="$t('common.language')" outlined emit-value map-options @update:model-value="changeLocale" />
        <q-toggle v-model="darkMode" :label="$t('common.darkMode')" @update:model-value="toggleDark" />
        <q-separator />
        <q-btn color="negative" :label="$t('auth.signOut')" class="full-width" @click="logout" />
        <p v-if="message" class="text-center text-positive">{{ message }}</p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import { usePageMeta } from '@/composables/usePageMeta';

usePageMeta({ title: 'Settings', description: 'Manage your TCG Matchmaker profile' });

const authStore = useAuthStore();
const appStore = useAppStore();
const router = useRouter();
const { locale: i18nLocale } = useI18n({ useScope: 'global' });
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const displayName = ref('');
const saving = ref(false);
const message = ref('');
const locale = ref(appStore.locale);
const darkMode = ref(appStore.darkMode);
const locales = [
  { label: 'English', value: 'en-US' },
  { label: 'Português (Brasil)', value: 'pt-BR' },
];

function changeLocale(val: string) { i18nLocale.value = val; appStore.setLocale(val); }
function toggleDark() { appStore.toggleDarkMode(); }

async function saveProfile() {
  saving.value = true;
  message.value = '';
  try {
    await fetch(`${apiUrl}/api/auth/profile`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName.value }),
    });
    message.value = 'Profile updated!';
  } catch { message.value = 'Failed to update profile'; }
  finally { saving.value = false; }
}

async function logout() { await authStore.signOut(); void router.push('/login'); }

onMounted(async () => {
  try {
    const r = await fetch(`${apiUrl}/api/auth/me`);
    const j = await r.json();
    if (j.data) displayName.value = j.data.display_name || '';
  } catch { /* ignore */ }
});
</script>
