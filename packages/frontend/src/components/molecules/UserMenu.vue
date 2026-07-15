<template>
  <template v-if="authStore.user">
    <q-btn-dropdown flat>
      <template #label>
        <q-avatar size="32px" color="accent" text-color="white" class="q-mr-xs">
          {{ userInitial }}
        </q-avatar>
        {{ displayName }}
      </template>
      <q-list>
        <q-item v-close-popup clickable to="/notifications">
          <q-item-section avatar><q-icon name="notifications" /></q-item-section>
          <q-item-section>{{ $t('nav.notifications') }}</q-item-section>
        </q-item>
        <q-item v-close-popup clickable to="/settings">
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>{{ $t('nav.settings') }}</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="logout">
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';

const authStore = useAuthStore();
const router = useRouter();

const displayName = computed(() => authStore.user?.email?.split('@')[0] || 'User');
const userInitial = computed(() => (authStore.user?.email?.[0] || 'U').toUpperCase());

function logout() {
  void authStore.signOut().then(() => router.push('/login'));
}
</script>
