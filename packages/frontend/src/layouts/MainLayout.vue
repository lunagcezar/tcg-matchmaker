<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>{{ $t('app.title') }}</q-toolbar-title>
        <q-btn v-if="authStore.user" flat icon="logout" :label="$t('nav.logout')" @click="logout" />
        <q-btn v-else flat :label="$t('nav.login')" to="/login" />
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
        <q-item clickable to="/matches/new">
          <q-item-section avatar><q-icon name="sports_esports" /></q-item-section>
          <q-item-section>{{ $t('event.match') }}</q-item-section>
        </q-item>
        <q-item clickable to="/trading/new">
          <q-item-section avatar><q-icon name="swap_horiz" /></q-item-section>
          <q-item-section>{{ $t('event.trading') }}</q-item-section>
        </q-item>
        <q-item clickable to="/tournaments/new">
          <q-item-section avatar><q-icon name="emoji_events" /></q-item-section>
          <q-item-section>{{ $t('event.tournament') }}</q-item-section>
        </q-item>
        <q-separator v-if="authStore.user" />
        <q-item-label v-if="authStore.user" header>{{ authStore.user.email }}</q-item-label>
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
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';

const authStore = useAuthStore();
const router = useRouter();
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function logout() {
  void authStore.signOut().then(() => router.push('/login'));
}

onMounted(() => {
  void authStore.restoreSession();
});
</script>
