<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title class="text-weight-bold cursor-pointer" to="/">
          {{ $t('app.title') }}
        </q-toolbar-title>

        <q-btn flat round :icon="appStore.darkMode ? 'light_mode' : 'dark_mode'" @click="appStore.toggleDarkMode()">
          <q-tooltip>{{ $t('common.darkMode') }}</q-tooltip>
        </q-btn>

        <q-btn-dropdown flat :label="currentLangLabel">
          <q-list>
            <q-item v-for="lang in languages" :key="lang.value" clickable v-close-popup @click="switchLang(lang.value)">
              <q-item-section><q-item-label>{{ lang.label }}</q-item-label></q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <template v-if="authStore.user">
          <q-btn-dropdown flat>
            <template #label>
              <q-avatar size="32px" color="accent" text-color="white" class="q-mr-xs">
                {{ userInitial }}
              </q-avatar>
              {{ authStore.user.email?.split('@')[0] }}
            </template>
            <q-list>
              <q-item clickable v-close-popup to="/settings">
                <q-item-section avatar><q-icon name="settings" /></q-item-section>
                <q-item-section>{{ $t('nav.settings') }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>{{ $t('nav.logout') }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </template>
        <template v-else>
          <q-btn flat :label="$t('nav.login')" to="/login" class="q-mr-xs" />
          <q-btn flat outline :label="$t('nav.signup')" to="/signup" />
        </template>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>{{ $t('nav.home') }}</q-item-label>
        <q-item clickable to="/">
          <q-item-section avatar><q-icon name="home" /></q-item-section>
          <q-item-section>{{ $t('nav.home') }}</q-item-section>
        </q-item>
        <q-item clickable to="/stores">
          <q-item-section avatar><q-icon name="store" /></q-item-section>
          <q-item-section>{{ $t('nav.stores') }}</q-item-section>
        </q-item>
        <q-separator />
        <q-item-label header>{{ $t('event.type') }}</q-item-label>
        <q-item clickable to="/matches">
          <q-item-section avatar><q-icon name="sports_esports" /></q-item-section>
          <q-item-section>{{ $t('nav.matches') }}</q-item-section>
        </q-item>
        <q-item clickable to="/trading">
          <q-item-section avatar><q-icon name="swap_horiz" /></q-item-section>
          <q-item-section>{{ $t('nav.trading') }}</q-item-section>
        </q-item>
        <q-item clickable to="/tournaments">
          <q-item-section avatar><q-icon name="emoji_events" /></q-item-section>
          <q-item-section>{{ $t('nav.tournaments') }}</q-item-section>
        </q-item>
        <q-separator v-if="authStore.user" />
        <q-item v-if="authStore.user" clickable to="/settings">
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>{{ $t('nav.settings') }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';

const authStore = useAuthStore();
const appStore = useAppStore();
const router = useRouter();
const { locale } = useI18n({ useScope: 'global' });
const leftDrawerOpen = ref(false);

const languages = [
  { label: 'English', value: 'en-US' },
  { label: 'Português', value: 'pt-BR' },
];

const currentLangLabel = computed(() => languages.find((l) => l.value === locale.value)?.label || 'EN');
const userInitial = computed(() => (authStore.user?.email?.[0] || 'U').toUpperCase());

function switchLang(val: string) { locale.value = val; appStore.setLocale(val); }

function logout() { void authStore.signOut().then(() => router.push('/login')); }

onMounted(() => { void authStore.restoreSession(); });
</script>
