<template>
  <AppCard
    :title="$t('event.createTrading')"
    width="600px"
    page-class="q-pa-md flex flex-center"
    body-class=""
    title-class="q-my-none"
    :error="error"
  >
    <q-form ref="formRef" class="q-gutter-sm" @submit.prevent="save">
      <q-input
        v-model="form.name"
        :label="$t('event.name')"
        outlined
        :rules="[(v) => !!v || 'Name is required']"
      />
      <q-input v-model="form.details" :label="$t('event.details')" outlined type="textarea" />
      <DateTimePicker
        v-model="form.scheduled_at"
        :label="$t('event.scheduledAt')"
        :rules="[(v) => !!v || 'Date and time are required']"
      />
      <LocationAutocomplete
        v-model="form.custom_location_name"
        :label="$t('event.location')"
        :rules="[(v) => !!v || 'Location is required']"
        @select="
          (lat: number, lng: number, displayName: string) => {
            form.lat = lat;
            form.lng = lng;
            form.custom_location_name = displayName;
          }
        "
      />
      <q-input
        v-model="form.max_participants"
        :label="$t('event.maxParticipants')"
        type="number"
        outlined
        min="2"
        :rules="[(v: number) => v >= 2 || 'Minimum is 2']"
      />
      <q-btn
        type="submit"
        color="primary"
        :label="$t('event.createTrading')"
        class="full-width"
        :loading="saving"
      />
    </q-form>
  </AppCard>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import DateTimePicker from '@/components/molecules/DateTimePicker.vue';
import LocationAutocomplete from '@/components/molecules/fields/LocationAutocomplete.vue';
import { useFormSubmit } from '@/composables/useFormSubmit';
import AppCard from '@/layouts/AppCardLayout.vue';
import { useEventStore } from '@/stores/useEventStore';

const store = useEventStore();
const router = useRouter();
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);
const form = reactive({
  name: '',
  details: '',
  scheduled_at: '',
  lat: 0,
  lng: 0,
  custom_location_name: '',
  max_participants: 10,
});

const { saving, error, save } = useFormSubmit({
  validate: () => formRef.value?.validate() ?? true,
  submit: async () => {
    await store.create({
      type: 'trading',
      ...form,
      max_participants: Number(form.max_participants),
    });
  },
  onSuccess: () => void router.push('/trading'),
});
</script>
