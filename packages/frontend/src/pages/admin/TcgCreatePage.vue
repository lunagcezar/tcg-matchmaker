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
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

import AppCard from '@/components/molecules/AppCard.vue';
import { apiPost } from '@/composables/useApi';

const router = useRouter();
const saving = ref(false);
const error = ref('');
const form = reactive({ name: '', slug: '' });

async function save() {
  if (!form.name || !form.slug) {
    error.value = 'Name and slug are required';
    return;
  }
  saving.value = true;
  error.value = '';
  try {
    await apiPost('/api/tcgs', { ...form });
    void router.push('/admin/tcgs');
  } catch {
    error.value = 'Failed to create TCG';
  } finally {
    saving.value = false;
  }
}
</script>
