<template>
  <q-page class="row items-center justify-center">
    <AppCard :title="$t('auth.signUp')">
      <AuthForm :submit-label="$t('auth.signUp')" :on-submit="handleSignup" :fields="['email', 'username', 'displayName', 'password']">
        <template #footer>
          <p>{{ $t('auth.haveAccount') }} <router-link to="/login">{{ $t('auth.signIn') }}</router-link></p>
        </template>
      </AuthForm>
    </AppCard>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';
import AppCard from '@/components/atoms/AppCard.vue';
import AuthForm from '@/components/molecules/AuthForm.vue';

const authStore = useAuthStore();
const router = useRouter();

async function handleSignup(data: { email: string; password: string; username?: string; displayName?: string }) {
  await authStore.signUp(data.email, data.password);
  void router.push('/');
}
</script>
