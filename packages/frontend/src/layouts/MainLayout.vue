<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold cursor-pointer" to="/">
          {{ $t('app.title') }}
        </q-toolbar-title>
        <template v-for="item in headerNavItems" :key="item.to">
          <q-btn
            flat
            :label="$t(item.labelKey!)"
            :to="item.to!"
            class="q-mr-xs"
            :class="{ 'text-weight-bold': isActiveRoute(item.to!) }"
          />
        </template>
        <ThemeLangSwitcher />
        <NotificationBell />
        <UserMenu />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import ThemeLangSwitcher from '@/components/molecules/ThemeLangSwitcher.vue';
import UserMenu from '@/components/molecules/UserMenu.vue';
import NotificationBell from '@/components/molecules/NotificationBell.vue';
import { headerNavItems } from '@/router/navItems';

const route = useRoute();
const $q = useQuasar();
const authStore = useAuthStore();
const appStore = useAppStore();

function isActiveRoute(path: string): boolean {
  return route.path === path;
}

onMounted(() => {
  void authStore.restoreSession();
});

$q.dark.set(appStore.darkMode);
watch(
  () => appStore.darkMode,
  (val) => {
    $q.dark.set(val);
  },
);
</script>
