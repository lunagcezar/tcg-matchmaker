<template>
  <q-page class="row items-center justify-center">
    <AppCard :title="$t('auth.signUp')">
      <AuthForm
        :submit-label="$t('auth.signUp')"
        :on-submit="handleSignup"
        :fields="['email', 'username', 'displayName', 'password']"
        :loading="loading"
      >
        <template #extra>
          <TurnstileWidget v-if="siteKey" :site-key="siteKey" @token="turnstileToken = $event" />
        </template>
        <template #footer>
          <p>
            {{ $t('auth.haveAccount') }}
            <router-link to="/login">{{ $t('auth.signIn') }}</router-link>
          </p>
        </template>
      </AuthForm>
    </AppCard>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePageMeta } from '@/composables/usePageMeta';
import AppCard from '@/components/atoms/AppCard.vue';
import AuthForm from '@/components/molecules/AuthForm.vue';

usePageMeta({ titleKey: 'meta.signup', descKey: 'meta.signupDesc' });
import TurnstileWidget from '@/components/molecules/TurnstileWidget.vue';
import { getClient } from '@/composables/useApi';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const turnstileToken = ref('');

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

async function handleSignup(data: { email: string; password: string }) {
  loading.value = true;
  try {
    if (turnstileToken.value) {
      const verifyRes = await getClient().api['verify-turnstile'].$post({
        json: { token: turnstileToken.value },
      });
      const verifyBody = await verifyRes.json();
      if (!verifyBody.data?.success) {
        return;
      }
    }
    await authStore.signUp(data.email, data.password);
    void router.push('/');
  } finally {
    loading.value = false;
  }
}
</script>
