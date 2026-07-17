<template>
  <AppCard
    :title="$t('store.create')"
    width="600px"
    page-class="q-pa-md flex flex-center"
    body-class="q-gutter-md"
    title-class="q-my-none"
    :error="error"
  >
    <q-input v-model="form.name" :label="$t('store.name')" required outlined />
    <q-input v-model="form.address" :label="$t('store.address')" required outlined />
    <LocationAutocomplete
      ref="locationRef"
      :label="$t('store.searchLocation')"
      @select="onLocationSelect"
    />
    <div class="row q-col-gutter-sm">
      <q-input v-model="form.city" class="col-6" :label="$t('store.city')" outlined />
      <q-input v-model="form.state" class="col-6" :label="$t('store.state')" outlined />
    </div>
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
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useStoreStore } from '@/stores/useStoreStore';
import AppCard from '@/components/molecules/AppCard.vue';
import LocationAutocomplete from '@/components/molecules/fields/LocationAutocomplete.vue';

const storeStore = useStoreStore();
const router = useRouter();
const locationRef = ref<InstanceType<typeof LocationAutocomplete>>();
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

function onLocationSelect(
  lat: number,
  lng: number,
  _displayName: string,
  city?: string,
  state?: string,
) {
  form.lat = lat;
  form.lng = lng;
  if (city) form.city = city;
  if (state) form.state = state;
  if (!form.address) form.address = _displayName;
}

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
