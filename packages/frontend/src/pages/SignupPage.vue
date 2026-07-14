<template>
  <q-page class="row items-center justify-center">
    <q-card style="width: 400px">
      <q-card-section>
        <h5 class="text-center q-mb-md">{{ $t('auth.signUp') }}</h5>
        <q-form @submit="handleSignup" class="q-gutter-md">
          <q-input v-model="email" :label="$t('auth.email')" type="email" required outlined />
          <q-input v-model="username" :label="$t('auth.username')" required outlined />
          <q-input v-model="displayName" :label="$t('auth.displayName')" required outlined />
          <q-input v-model="password" :label="$t('auth.password')" type="password" required outlined />
          <q-btn type="submit" color="primary" :label="$t('auth.signUp')" class="full-width" :loading="loading" />
          <p class="text-center">
            {{ $t('auth.haveAccount') }}
            <router-link to="/login">{{ $t('auth.signIn') }}</router-link>
          </p>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';

const authStore = useAuthStore();
const router = useRouter();
const email = ref('');
const password = ref('');
const username = ref('');
const displayName = ref('');
const loading = ref(false);

async function handleSignup() {
  loading.value = true;
  try {
    await authStore.signUp(email.value, password.value);
    void router.push('/');
  } catch {
    // Error handled by auth store or UI
  } finally {
    loading.value = false;
  }
}
</script>
