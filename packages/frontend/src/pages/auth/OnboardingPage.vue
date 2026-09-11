<template>
  <AppCard
    :title="$t('auth.onboarding')"
    :error="error"
    :success="success"
    page-class="row items-center justify-center"
  >
    <AuthForm
      :submit-label="$t('auth.signUp')"
      :on-submit="handleOnboarding"
      :loading="loading"
      :fields="['email', 'username', 'password', 'confirmPassword']"
    />
  </AppCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { usePageMeta } from '@/composables/usePageMeta';
import { useAuthStore } from '@/stores/useAuthStore';

usePageMeta({ titleKey: 'meta.onboarding', descKey: 'meta.onboardingDesc' });
import AppCard from '@/components/molecules/AppCard.vue';
import AuthForm from '@/components/molecules/AuthForm.vue';
import { apiPost } from '@/composables/useApi';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const success = ref('');

onMounted(async () => {
  const needsOnboarding = await authStore.checkOnboarding();
  if (!needsOnboarding) {
    void router.push('/');
  }
});

async function handleOnboarding(data: Record<string, unknown>) {
  const email = data.email as string;
  const password = data.password as string;
  const username = data.username as string | undefined;
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    const body = await apiPost('/api/auth/onboarding', {
      email,
      password,
      username,
    });
    if (body.error) {
      error.value = body.error || 'Failed to create admin';
      return;
    }
    success.value = 'Admin account created! Redirecting to login...';
    setTimeout(() => void router.push('/login'), 1500);
  } catch {
    error.value = 'Failed to connect to server';
  } finally {
    loading.value = false;
  }
}
</script>
