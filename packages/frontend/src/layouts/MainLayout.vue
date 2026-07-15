<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title class="text-weight-bold cursor-pointer" to="/">
          {{ $t('app.title') }}
        </q-toolbar-title>
        <template v-for="item in headerNavItems" :key="item.to">
          <q-btn flat :label="$t(item.labelKey!)" :to="item.to!" :exact="item.exact" class="q-mr-xs" active-class="text-weight-bold" />
        </template>
        <ThemeLangSwitcher />
        <UserMenu />
      </q-toolbar>
    </q-header>
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <template v-for="item in drawerNavItems" :key="item.to || item.labelKey">
          <q-separator v-if="item.divider" />
          <q-item v-else-if="!item.auth || authStore.user" clickable :to="item.to!">
            <q-item-section avatar v-if="item.icon"><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ $t(item.labelKey!) }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/useAuthStore';
import ThemeLangSwitcher from '@/components/molecules/ThemeLangSwitcher.vue';
import UserMenu from '@/components/molecules/UserMenu.vue';
import { headerNavItems, drawerNavItems } from '@/router/navItems';

const authStore = useAuthStore();
const leftDrawerOpen = ref(false);
onMounted(() => { void authStore.restoreSession(); });
</script>
