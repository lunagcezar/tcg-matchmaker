<template>
  <q-page class="row items-center justify-center">
    <AppCard :title="$t('auth.signIn')">
      <AuthForm :submit-label="$t('auth.signIn')" :on-submit="handleLogin">
        <template #footer>
          <p>{{ $t('auth.noAccount') }} <router-link to="/signup">{{ $t('auth.signUp') }}</router-link></p>
        </template>
      </AuthForm>
    </AppCard>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePageMeta } from '@/composables/usePageMeta';
import AppCard from '@/components/atoms/AppCard.vue';
import AuthForm from '@/components/molecules/AuthForm.vue';

usePageMeta({ titleKey: 'meta.login', descKey: 'meta.loginDesc' });

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

async function handleLogin(data: { email: string; password: string }) {
  await authStore.signIn(data.email, data.password);
  const redirect = (route.query.redirect as string) || '/';
  void router.push(redirect);
}
</script>
