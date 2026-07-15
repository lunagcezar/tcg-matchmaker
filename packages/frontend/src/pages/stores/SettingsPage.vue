<template>
  <q-page class="q-pa-md row justify-center">
    <q-card style="width: 600px">
      <q-card-section><h5 class="q-my-none">{{ $t('store.settings') }}</h5></q-card-section>
      <q-card-section class="q-gutter-md">
        <q-input v-model="form.name" :label="$t('store.name')" outlined />
        <q-input v-model="form.address" :label="$t('store.address')" outlined />
        <q-input v-model="form.phone" :label="$t('store.phone')" outlined />
        <q-btn color="primary" :label="$t('common.save')" class="full-width" :loading="saving" @click="save" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStoreStore } from '@/stores/useStoreStore';

const route = useRoute();
const storeStore = useStoreStore();
const saving = ref(false);
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const storeId = route.params.id as string;
const form = reactive({ name: '', address: '', phone: '' });

onMounted(async () => {
  const s = await storeStore.get(storeId) as Record<string, string> | null;
  if (s) { form.name = s.name || ''; form.address = s.address || ''; form.phone = s.phone || ''; }
});

async function save() {
  saving.value = true;
  try {
    await fetch(`${apiUrl}/api/stores/${storeId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
  } finally { saving.value = false; }
}
</script>
