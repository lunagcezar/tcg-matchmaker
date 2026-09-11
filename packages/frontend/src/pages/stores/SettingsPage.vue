<template>
  <AppCard
    :title="$t('store.settings')"
    width="600px"
    page-class="q-pa-md flex flex-center"
    body-class="q-gutter-md"
    title-class="q-my-none"
    :error="error"
  >
    <q-input v-model="form.name" :label="$t('store.name')" outlined />
    <q-input v-model="form.address" :label="$t('store.address')" outlined />
    <q-input v-model="form.phone" :label="$t('store.phone')" outlined />
    <q-btn
      color="primary"
      :label="$t('common.save')"
      class="full-width"
      :loading="saving"
      @click="save"
    />
  </AppCard>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import AppCard from '@/layouts/AppCardLayout.vue';
import { useStoreStore } from '@/stores/useStoreStore';

const route = useRoute();
const storeStore = useStoreStore();
const saving = ref(false);
const error = ref('');
const storeId = route.params.id as string;
const form = reactive({ name: '', address: '', phone: '' });

onMounted(async () => {
  const s = await storeStore.get(storeId);
  if (s) {
    form.name = s.name || '';
    form.address = s.address || '';
    form.phone = s.phone || '';
  }
});

async function save() {
  saving.value = true;
  try {
    await storeStore.update(storeId, form);
  } finally {
    saving.value = false;
  }
}
</script>
