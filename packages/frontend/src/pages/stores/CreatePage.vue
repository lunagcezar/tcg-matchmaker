<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 600px">
      <q-card-section
        ><h5 class="q-my-none">{{ $t('store.create') }}</h5></q-card-section
      >
      <q-card-section class="q-gutter-md">
        <q-input v-model="form.name" :label="$t('store.name')" required outlined />
        <q-input v-model="form.address" :label="$t('store.address')" required outlined />
        <div class="row q-col-gutter-sm">
          <q-input v-model="form.city" class="col-6" :label="$t('store.city')" outlined />
          <q-input v-model="form.state" class="col-6" :label="$t('store.state')" outlined />
        </div>
        <div class="row q-col-gutter-sm">
          <q-input
            v-model="form.lat"
            class="col-6"
            :label="$t('store.latitude')"
            type="number"
            outlined
          />
          <q-input
            v-model="form.lng"
            class="col-6"
            :label="$t('store.longitude')"
            type="number"
            outlined
          />
        </div>
        <q-input v-model="form.phone" :label="$t('store.phone')" outlined />
        <q-btn
          color="primary"
          :label="$t('common.save')"
          class="full-width"
          :loading="saving"
          @click="save"
        />
        <p v-if="error" class="text-negative text-center">{{ error }}</p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useStoreStore } from '@/stores/useStoreStore';

const storeStore = useStoreStore();
const router = useRouter();
const saving = ref(false);
const error = ref('');
const form = reactive({
  name: '',
  address: '',
  city: 'Fortaleza',
  state: 'Ceará',
  lat: 0,
  lng: 0,
  phone: '',
});

async function save() {
  saving.value = true;
  error.value = '';
  try {
    await storeStore.create({ ...form, lat: Number(form.lat), lng: Number(form.lng) });
    void router.push('/stores');
  } catch {
    error.value = 'Failed to create store';
  } finally {
    saving.value = false;
  }
}
</script>
