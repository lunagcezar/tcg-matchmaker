<template>
  <q-page class="row items-center justify-center">
    <AppCard :title="$t('auth.signIn')">
      <p v-if="error" class="text-negative text-center q-mb-sm">{{ error }}</p>
      <p v-if="success" class="text-positive text-center q-mb-sm">{{ success }}</p>
      <AuthForm :submit-label="$t('auth.signIn')" :on-submit="handleLogin" :loading="loading">
        <template #footer>
          <p>
            {{ $t('auth.noAccount') }}
            <router-link to="/signup">{{ $t('auth.signUp') }}</router-link>
          </p>
        </template>
      </AuthForm>
    </AppCard>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePageMeta } from '@/composables/usePageMeta';
import AppCard from '@/components/atoms/AppCard.vue';
import AuthForm from '@/components/molecules/AuthForm.vue';

usePageMeta({ titleKey: 'meta.login', descKey: 'meta.loginDesc' });

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const error = ref('');
const success = ref('');

async function handleLogin(data: { email: string; password: string }) {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    await authStore.signIn(data.email, data.password);
    success.value = '';
    const redirect = (route.query.redirect as string) || '/';
    void router.push(redirect);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to sign in';
  } finally {
    loading.value = false;
  }
}
</script>
