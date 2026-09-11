<template>
  <q-layout view="hHh LpR fFf">
    <header class="app-navbar">
      <div class="app-navbar__inner">
        <div class="row items-center gap-2">
          <q-btn
            flat
            dense
            round
            icon="menu"
            class="app-navbar__toggle"
            aria-label="Toggle navigation"
            @click="drawerOpen = !drawerOpen"
          />
          <router-link
            to="/"
            class="text-weight-bold text-h6 tracking-tight"
            style="color: var(--primary); text-decoration: none"
          >
            {{ $t('app.title') }}
          </router-link>
        </div>
        <div class="row items-center gap-1">
          <ThemeLangSwitcher />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>

    <div
      class="app-mobile-drawer"
      :class="{ 'app-mobile-drawer--open': drawerOpen }"
      data-testid="mobile-drawer"
    >
      <ul class="space-y-0.5">
        <SiteBranch
          v-for="node in tree"
          :key="node.href"
          :node="node"
          @navigate="drawerOpen = false"
        />
      </ul>
      <q-separator />
      <div class="row items-center gap-1 q-px-sm q-pt-sm">
        <ThemeLangSwitcher />
      </div>
      <div class="app-sidebar__footer">
        {{ $t('sidebar.copyright') }}
        <a href="https://artemisluna.com.br" target="_blank" rel="noopener noreferrer"
          >artemisluna.com.br</a
        >
      </div>
    </div>

    <div class="app-shell">
      <nav class="app-sidebar">
        <div class="app-sidebar__scroll">
          <ul class="space-y-0.5">
            <SiteBranch v-for="node in tree" :key="node.href" :node="node" />
          </ul>
          <q-separator />
          <div class="app-sidebar__footer">
            {{ $t('sidebar.copyright') }}
            <a href="https://artemisluna.com.br" target="_blank" rel="noopener noreferrer"
              >artemisluna.com.br</a
            >
          </div>
        </div>
      </nav>
      <q-page-container class="app-main">
        <router-view />
      </q-page-container>
    </div>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { watch, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import SiteBranch from '@/components/molecules/navigation/SiteBranch.vue';
import NotificationBell from '@/components/molecules/NotificationBell.vue';
import ThemeLangSwitcher from '@/components/molecules/ThemeLangSwitcher.vue';
import UserMenu from '@/components/molecules/UserMenu.vue';
import { useNavTree } from '@/composables/useNavTree';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';

const route = useRoute();
const $q = useQuasar();
const authStore = useAuthStore();
const appStore = useAppStore();
const { tree } = useNavTree();
const drawerOpen = ref(false);

watch(
  () => route.path,
  () => {
    drawerOpen.value = false;
  },
);

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

<style scoped>
.app-navbar__toggle {
  display: inline-flex;
}

@media (min-width: 1024px) {
  .app-navbar__toggle {
    display: none;
  }
}
</style>
