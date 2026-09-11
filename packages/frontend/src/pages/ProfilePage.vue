<template>
  <AppDetailLayout :item="profile" :loading="loading" :show-empty="!profile && !loading">
    <div v-if="profile" class="q-pa-md">
      <div class="flex flex-center q-mb-md">
        <q-avatar size="80px" color="primary" text-color="white" class="text-h4">
          {{ (profile.username?.[0] || 'U').toUpperCase() }}
        </q-avatar>
      </div>
      <h5 class="q-my-none text-center">{{ profile.username }}</h5>
      <div class="text-center q-mt-sm">
        <q-badge :color="roleColor(profile.role)" class="q-px-sm q-py-xs">
          {{ $t(`profile.role`) }}: {{ profile.role }}
        </q-badge>
      </div>
      <p class="text-caption text-center text-grey q-mt-sm">
        {{ $t('profile.memberSince') }} {{ formatDate(profile.created_at) }}
      </p>
    </div>
  </AppDetailLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { apiGet } from '@/composables/useApi';
import { useFormatDate } from '@/composables/useFormatDate';
import { usePageMeta } from '@/composables/usePageMeta';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';
import { roleColor } from '@/lib/colors';
import type { UserProfile } from '@/stores/useAuthStore';

usePageMeta({ titleKey: 'profile.title', descKey: 'profile.title' });

const { formatDate } = useFormatDate();
const loading = ref(true);
const profile = ref<UserProfile | null>(null);

onMounted(async () => {
  try {
    const { data } = await apiGet(`/api/auth/me`);
    profile.value = data as typeof profile.value;
  } catch {
    profile.value = null;
  } finally {
    loading.value = false;
  }
});
</script>
