<template>
  <q-page class="q-pa-md row justify-center">
    <q-card style="width: 600px">
      <q-card-section><h5 class="q-my-none">{{ $t('event.createMatch') }}</h5></q-card-section>
      <q-card-section class="q-gutter-md">
        <q-input v-model="form.scheduled_at" :label="$t('event.scheduledAt')" type="datetime-local" required outlined />
        <q-input v-model="form.lat" :label="$t('store.latitude')" type="number" outlined />
        <q-input v-model="form.lng" :label="$t('store.longitude')" type="number" outlined />
        <q-input v-model="form.max_participants" :label="$t('event.maxParticipants')" type="number" outlined hint="Default: 2" />
        <q-btn color="primary" :label="$t('event.createMatch')" class="full-width" :loading="saving" @click="save" />
        <p v-if="error" class="text-negative text-center">{{ error }}</p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';

const store = useEventStore();
const router = useRouter();
const saving = ref(false);
const error = ref('');
const form = reactive({ scheduled_at: '', lat: 0, lng: 0, max_participants: 2 });

async function save() {
  saving.value = true;
  error.value = '';
  try {
    await store.create({ type: 'match', ...form, max_participants: Number(form.max_participants) });
    void router.push('/matches');
  } catch {
    error.value = 'Failed to create match';
  } finally { saving.value = false; }
}
</script>
