<template>
  <AppCard
    :title="$t('event.createTrading')"
    width="600px"
    page-class="q-pa-md flex flex-center"
    body-class="q-gutter-md"
    title-class="q-my-none"
    :error="error"
  >
    <q-input v-model="form.name" :label="$t('event.type')" outlined />
    <q-input v-model="form.details" :label="$t('event.details')" outlined type="textarea" />
    <q-input v-model="form.scheduled_at" :label="$t('event.scheduledAt')" outlined>
      <template #append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy>
            <div class="row items-start no-wrap">
              <q-date v-model="form.scheduled_at" mask="YYYY-MM-DD HH:mm" />
              <q-time v-model="form.scheduled_at" mask="YYYY-MM-DD HH:mm" now-button />
            </div>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
    <LocationAutocomplete
      :label="$t('event.location')"
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
    />
    <q-btn
      color="positive"
      :label="$t('event.createTrading')"
      class="full-width"
      :loading="saving"
      @click="save"
    />
  </AppCard>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';
import AppCard from '@/components/molecules/AppCard.vue';
import LocationAutocomplete from '@/components/molecules/fields/LocationAutocomplete.vue';

const store = useEventStore();
const router = useRouter();
const saving = ref(false);
const error = ref('');
const form = reactive({
  name: '',
  details: '',
  scheduled_at: '',
  lat: 0,
  lng: 0,
  custom_location_name: '',
  max_participants: 10,
});

async function save() {
  saving.value = true;
  error.value = '';
  try {
    await store.create({
      type: 'trading',
      ...form,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      max_participants: Number(form.max_participants),
    });
    void router.push('/trading');
  } catch {
    error.value = 'Failed to create session';
  } finally {
    saving.value = false;
  }
}
</script>
