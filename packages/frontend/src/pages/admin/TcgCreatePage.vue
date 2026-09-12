<template>
  <AppCard
    :title="$t('admin.newTcg')"
    width="600px"
    page-class="q-pa-md flex flex-center"
    body-class="q-gutter-md"
    title-class="q-my-none"
    :error="error"
  >
    <q-input v-model="form.name" :label="$t('store.name')" outlined required />
    <q-input
      v-model="form.slug"
      :label="$t('common.save') + ' slug'"
      outlined
      required
      hint="URL-friendly identifier"
    />
    <q-btn
      color="primary"
      :label="$t('admin.newTcg')"
      class="full-width"
      :loading="saving"
      @click="save"
    />
  </AppCard>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';

import { apiPost } from '@/composables/useApi';
import { useFormSubmit } from '@/composables/useFormSubmit';
import AppCard from '@/layouts/AppCardLayout.vue';

const router = useRouter();
const form = reactive({ name: '', slug: '' });

const { saving, error, save } = useFormSubmit({
  submit: async () => {
    if (!form.name || !form.slug) throw new Error('Name and slug are required');
    await apiPost('/api/tcgs', { ...form });
  },
  onSuccess: () => void router.push('/admin/tcgs'),
});
</script>
