<template>
  <AppCard
    :title="$t('store.create')"
    width="600px"
    page-class="q-pa-md flex flex-center"
    body-class=""
    title-class="q-my-none"
    :error="error"
  >
    <q-form ref="formRef" class="q-gutter-md" @submit.prevent="save">
      <q-input
        v-model="form.name"
        :label="$t('store.name')"
        outlined
        :rules="[(v) => !!v || 'Name is required']"
      />
      <LocationAutocomplete
        ref="locationRef"
        v-model="form.address"
        :label="$t('store.address')"
        :rules="[(v) => !!v || 'Address is required']"
        @select="onLocationSelect"
      />
      <div class="row q-col-gutter-sm">
        <q-input
          v-model="form.city"
          class="col-6"
          :label="$t('store.city')"
          outlined
          :rules="[(v) => !!v || 'City is required']"
        />
        <q-input
          v-model="form.state"
          class="col-6"
          :label="$t('store.state')"
          outlined
          :rules="[(v) => !!v || 'State is required']"
        />
      </div>
      <q-input v-model="form.phone" :label="$t('store.phone')" outlined />
      <q-btn
        type="submit"
        color="primary"
        :label="$t('common.save')"
        class="full-width"
        :loading="saving"
      />
    </q-form>
  </AppCard>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

import AppCard from '@/components/molecules/AppCard.vue';
import LocationAutocomplete from '@/components/molecules/fields/LocationAutocomplete.vue';
import { useStoreStore } from '@/stores/useStoreStore';

const storeStore = useStoreStore();
const router = useRouter();
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);
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
  const valid = formRef.value ? await formRef.value.validate() : true;
  if (!valid) return;
  saving.value = true;
  error.value = '';
  try {
    await storeStore.create({ ...form, lat: Number(form.lat), lng: Number(form.lng) });
    void router.push('/stores');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create store';
  } finally {
    saving.value = false;
  }
}
</script>
