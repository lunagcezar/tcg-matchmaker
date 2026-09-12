<template>
  <AppCard
    :title="$t('auth.signIn')"
    :error="error"
    :success="success"
    page-class="row items-center justify-center"
  >
    <AuthForm
      :fields="['identifier', 'password']"
      :submit-label="$t('auth.signIn')"
      :on-submit="handleLogin"
      :loading="loading"
    >
      <template #extra>
        <q-checkbox v-model="rememberMe" :label="$t('auth.rememberMe')" />
      </template>
      <template #footer>
        <AuthFooter mode="login" />
      </template>
    </AuthForm>
  </AppCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';

import AuthFooter from '@/components/molecules/AuthFooter.vue';
import AuthForm from '@/components/molecules/AuthForm.vue';
import { usePageMeta } from '@/composables/usePageMeta';
import AppCard from '@/layouts/AppCardLayout.vue';
import { ACCOUNT_BANNED_MESSAGE, ACCOUNT_DELETED_MESSAGE } from '@/lib/authMessages';
import { useAuthStore } from '@/stores/useAuthStore';

usePageMeta({ titleKey: 'meta.login', descKey: 'meta.loginDesc' });

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const loading = ref(false);
const error = ref('');
const success = ref('');
const rememberMe = ref(true);

onMounted(() => {
  if (route.query.reason === 'banned') {
    error.value = t('auth.banned');
  } else if (route.query.reason === 'deleted') {
    error.value = t('auth.deleted');
  }
  if (route.query.reason) {
    const query = { ...route.query };
    delete query.reason;
    void router.replace({ query });
  }
});

async function handleLogin(data: Record<string, unknown>) {
  const identifier = data.identifier as string;
  const password = data.password as string;
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    const email = await authStore.resolveIdentifier(identifier);
    await authStore.signIn(email, password, rememberMe.value);
    success.value = '';
    const redirect = (route.query.redirect as string) || '/';
    void router.push(redirect);
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message === ACCOUNT_BANNED_MESSAGE) error.value = t('auth.banned');
    else if (message === ACCOUNT_DELETED_MESSAGE) error.value = t('auth.deleted');
    else error.value = message || 'Failed to sign in';
  } finally {
    loading.value = false;
  }
}
</script>
