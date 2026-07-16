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
    <q-input
      v-model="form.scheduled_at"
      :label="$t('event.scheduledAt')"
      type="datetime-local"
      required
      outlined
    />
    <q-input v-model="form.lat" :label="$t('store.latitude')" type="number" outlined />
    <q-input v-model="form.lng" :label="$t('store.longitude')" type="number" outlined />
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
  max_participants: 10,
});

async function save() {
  saving.value = true;
  error.value = '';
  try {
    await store.create({
      type: 'trading',
      ...form,
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
