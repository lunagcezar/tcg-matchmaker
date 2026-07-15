<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title class="text-weight-bold cursor-pointer" to="/">
          {{ $t('app.title') }}
        </q-toolbar-title>

        <q-btn flat :label="$t('nav.matches')" to="/matches" class="q-mr-xs" />
        <q-btn flat :label="$t('nav.trading')" to="/trading" class="q-mr-xs" />
        <q-btn flat :label="$t('nav.tournaments')" to="/tournaments" class="q-mr-xs" />

        <ThemeLangSwitcher />
        <UserMenu />
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
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/useAuthStore';
import ThemeLangSwitcher from '@/components/molecules/ThemeLangSwitcher.vue';
import UserMenu from '@/components/molecules/UserMenu.vue';

const authStore = useAuthStore();
const leftDrawerOpen = ref(false);

onMounted(() => { void authStore.restoreSession(); });
</script>
