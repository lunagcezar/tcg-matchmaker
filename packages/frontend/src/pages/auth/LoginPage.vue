<template>
  <q-page class="row items-center justify-center">
    <q-card style="width: 400px">
      <q-card-section>
        <h5 class="text-center q-mb-md">{{ $t('auth.signIn') }}</h5>
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input v-model="email" :label="$t('auth.email')" type="email" required outlined />
          <q-input v-model="password" :label="$t('auth.password')" type="password" required outlined />
          <q-btn type="submit" color="primary" :label="$t('auth.signIn')" class="full-width" :loading="loading" />
          <p class="text-center">
            {{ $t('auth.noAccount') }}
            <router-link to="/signup">{{ $t('auth.signUp') }}</router-link>
          </p>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  try {
    await authStore.signIn(email.value, password.value);
    const redirect = (route.query.redirect as string) || '/';
    void router.push(redirect);
  } catch {
    // Error handled by auth store or UI
  } finally {
    loading.value = false;
  }
}
</script>
