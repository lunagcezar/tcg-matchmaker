<template>
  <q-page class="q-pa-md row justify-center">
    <q-card style="width: 600px">
      <q-card-section><h5 class="q-my-none">{{ $t('tournament.create') }}</h5></q-card-section>
      <q-card-section class="q-gutter-md">
        <q-input v-model="form.name" :label="$t('common.save') + ' name'" outlined />
        <q-input v-model="form.scheduled_at" :label="$t('event.scheduledAt')" type="datetime-local" required outlined />
        <q-input v-model="form.lat" :label="$t('store.latitude')" type="number" outlined />
        <q-input v-model="form.lng" :label="$t('store.longitude')" type="number" outlined />
        <q-input v-model="form.max_participants" :label="$t('event.maxParticipants')" type="number" outlined />
        <q-select v-model="form.bracket_type" :options="BRACKET_OPTIONS" label="Bracket Type" outlined emit-value map-options />
        <q-select v-model="form.best_of" :options="BEST_OF_OPTIONS" label="Best Of" outlined emit-value map-options />
        <q-btn color="warning" :label="$t('tournament.create')" class="full-width" :loading="saving" @click="save" />
        <p v-if="error" class="text-negative text-center">{{ error }}</p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { BRACKET_OPTIONS, BEST_OF_OPTIONS } from '@/constants/tournament';

usePageMeta({ titleKey: 'tournament.create' });

const store = useEventStore();
const router = useRouter();
const saving = ref(false);
const error = ref('');
const form = reactive({ name: '', scheduled_at: '', lat: 0, lng: 0, max_participants: 16, bracket_type: 'single_elimination', best_of: 1 });

async function save() {
  saving.value = true; error.value = '';
  try {
    await store.create({ type: 'tournament', ...form, max_participants: Number(form.max_participants) });
    void router.push('/tournaments');
  } catch { error.value = 'Failed to create tournament'; }
  finally { saving.value = false; }
}
</script>
