<template>
  <q-form class="q-gutter-md" @submit="handleSubmit">
    <q-input
      v-if="showField('email')"
      v-model="form.email"
      :label="$t('auth.email')"
      type="email"
      outlined
      lazy-rules
      :rules="[
        (val: string) => !!val || $t('auth.required'),
        (val: string) => /.+@.+\..+/.test(val) || $t('auth.invalidEmail'),
      ]"
    />
    <q-input
      v-if="showField('identifier')"
      v-model="form.identifier"
      :label="$t('auth.emailOrUsername')"
      outlined
      lazy-rules
      :rules="[(val: string) => !!val || $t('auth.required')]"
    />
    <q-input
      v-if="showField('username')"
      v-model="form.username"
      :label="$t('auth.username')"
      outlined
      lazy-rules
      :rules="[
        (val: string) => !!val || $t('auth.required'),
        (val: string) => val.length >= 3 || $t('auth.minLength', { min: 3 }),
      ]"
    />
    <q-input
      v-if="showField('password')"
      v-model="form.password"
      :label="$t('auth.password')"
      type="password"
      outlined
      lazy-rules
      :rules="[
        (val: string) => !!val || $t('auth.required'),
        (val: string) => val.length >= 8 || $t('auth.minLength', { min: 8 }),
      ]"
    />
    <q-input
      v-if="showField('confirmPassword')"
      v-model="form.confirmPassword"
      :label="$t('auth.confirmPassword')"
      type="password"
      outlined
      lazy-rules
      :rules="[
        (val: string) => !!val || $t('auth.required'),
        (val: string) => val === form.password || $t('auth.passwordsDontMatch'),
      ]"
    />
    <div v-if="$slots.extra">
      <slot name="extra" />
    </div>
    <div v-if="$slots.footer">
      <slot name="footer" />
    </div>
    <div class="flex flex-center">
      <q-btn
        type="submit"
        color="primary"
        class="full-width"
        :label="submitLabel"
        style="min-width: 200px"
        :loading="loading"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps<{
  fields?: string[];
  submitLabel: string;
  loading?: boolean;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}>();

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  username: '',
  identifier: '',
});
const defaultFields = ['email', 'password'];
const activeFields = props.fields ?? defaultFields;

function showField(name: string) {
  return activeFields.includes(name);
}

async function handleSubmit() {
  await props.onSubmit({ ...form });
}
</script>
