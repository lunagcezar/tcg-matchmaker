<template>
  <div class="q-gutter-sm">
    <q-input
      v-model="currentPassword"
      :label="$t('auth.currentPassword')"
      type="password"
      outlined
    />
    <q-input
      v-model="newPassword"
      :label="$t('auth.newPassword')"
      type="password"
      outlined
      :rules="[(val: string) => !val || val.length >= 8 || $t('auth.minLength', { min: 8 })]"
    />
    <q-input
      v-model="confirmNewPassword"
      :label="$t('auth.confirmPassword')"
      type="password"
      outlined
      :rules="[(val: string) => !val || val === newPassword || $t('auth.passwordsDontMatch')]"
    />
    <q-btn
      color="primary"
      :label="$t('common.save')"
      class="full-width"
      :loading="saving"
      @click="submit"
    />
    <p
      v-if="message || localMessage"
      class="text-center text-caption"
      :class="error || localError ? 'text-negative' : 'text-positive'"
    >
      {{ message || localMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  saving: boolean;
  message: string;
  error: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'save', newPassword: string): void;
}>();

const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const localMessage = ref('');
const localError = ref(false);

function submit() {
  localMessage.value = '';
  localError.value = false;
  if (!newPassword.value) {
    localMessage.value = 'New password is required';
    localError.value = true;
    return;
  }
  if (newPassword.value !== confirmNewPassword.value) {
    localMessage.value = 'Passwords do not match';
    localError.value = true;
    return;
  }
  emit('save', newPassword.value);
}
</script>
