<template>
  <q-page class="row items-center justify-center">
    <AppCard :title="$t('auth.onboarding')">
      <p v-if="error" class="text-negative text-center q-mb-sm">{{ error }}</p>
      <p v-if="success" class="text-positive text-center q-mb-sm">{{ success }}</p>
      <AuthForm
        :submit-label="$t('auth.signUp')"
        :on-submit="handleOnboarding"
        :loading="loading"
        :fields="['email', 'username', 'displayName', 'password', 'confirmPassword']"
      />
    </AppCard>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePageMeta } from '@/composables/usePageMeta';

usePageMeta({ titleKey: 'meta.onboarding', descKey: 'meta.onboardingDesc' });
import AppCard from '@/components/atoms/AppCard.vue';
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

async function handleOnboarding(data: {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}) {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    const body = await apiPost('/api/auth/onboarding', {
      email: data.email,
      password: data.password,
      username: data.username,
      display_name: data.displayName,
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
