<template>
  <AppCard
    :title="$t('auth.signUp')"
    :error="error"
    :success="success"
    page-class="row items-center justify-center"
  >
    <AuthForm
      :submit-label="$t('auth.signUp')"
      :on-submit="handleSignup"
      :fields="['email', 'username', 'password', 'confirmPassword']"
      :loading="loading"
    >
      <template #extra>
        <TurnstileWidget v-if="siteKey" :site-key="siteKey" @token="turnstileToken = $event" />
      </template>
      <template #footer>
        <AuthFooter mode="signup" />
      </template>
    </AuthForm>
  </AppCard>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import AppCard from '@/components/molecules/AppCard.vue';
import AuthFooter from '@/components/molecules/AuthFooter.vue';
import AuthForm from '@/components/molecules/AuthForm.vue';
import { usePageMeta } from '@/composables/usePageMeta';
import { useAuthStore } from '@/stores/useAuthStore';

usePageMeta({ titleKey: 'meta.signup', descKey: 'meta.signupDesc' });
import TurnstileWidget from '@/components/molecules/TurnstileWidget.vue';
import { apiPost } from '@/composables/useApi';

const $q = useQuasar();
const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const success = ref('');
const turnstileToken = ref('');

const siteKey = import.meta.env.QCLI_TURNSTILE_SITE_KEY || '';

async function handleSignup(data: Record<string, unknown>) {
  const email = data.email as string;
  const password = data.password as string;
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    if (turnstileToken.value) {
      const verifyBody = await apiPost('/api/verify-turnstile', { token: turnstileToken.value });
      if (!(verifyBody.data as Record<string, unknown>)?.success) {
        error.value = 'Captcha verification failed';
        return;
      }
    }
    await authStore.signUp(email, password);
    $q.notify({ type: 'positive', message: 'Account created! You can now sign in.' });
    void router.push('/login');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to sign up';
  } finally {
    loading.value = false;
  }
}
</script>
