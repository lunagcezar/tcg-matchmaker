<template>
  <q-form @submit="handleSubmit" class="q-gutter-md">
    <q-input v-if="showField('email')" v-model="form.email" :label="$t('auth.email')" type="email" required outlined />
    <q-input v-if="showField('username')" v-model="form.username" :label="$t('auth.username')" required outlined />
    <q-input v-if="showField('displayName')" v-model="form.displayName" :label="$t('auth.displayName')" required outlined />
    <q-input v-if="showField('password')" v-model="form.password" :label="$t('auth.password')" type="password" required outlined />
    <div v-if="$slots.footer" class="text-center">
      <slot name="footer" />
    </div>
    <q-btn type="submit" color="primary" :label="submitLabel" class="full-width" :loading="loading" />
  </q-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps<{
  fields?: string[];
  submitLabel: string;
  loading?: boolean;
  onSubmit: (data: { email: string; password: string; username?: string; displayName?: string }) => Promise<void>;
}>();

const form = reactive({ email: '', password: '', username: '', displayName: '' });
const defaultFields = ['email', 'password'];
const activeFields = props.fields ?? defaultFields;

function showField(name: string) {
  return activeFields.includes(name);
}

async function handleSubmit() {
  await props.onSubmit({ ...form });
}
</script>
