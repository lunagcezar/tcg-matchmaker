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
      :fields="['email', 'username', 'displayName', 'password', 'confirmPassword']"
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePageMeta } from '@/composables/usePageMeta';
import AppCard from '@/components/molecules/AppCard.vue';
import AuthForm from '@/components/molecules/AuthForm.vue';
import AuthFooter from '@/components/molecules/AuthFooter.vue';

usePageMeta({ titleKey: 'meta.signup', descKey: 'meta.signupDesc' });
import TurnstileWidget from '@/components/molecules/TurnstileWidget.vue';
import { apiPost } from '@/composables/useApi';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const success = ref('');
const turnstileToken = ref('');

const siteKey = import.meta.env.QCLI_TURNSTILE_SITE_KEY || '';

async function handleSignup(data: { email: string; password: string }) {
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
    await authStore.signUp(data.email, data.password);
    success.value = 'Account created! You can now sign in.';
    void router.push('/login');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to sign up';
  } finally {
    loading.value = false;
  }
}
</script>
