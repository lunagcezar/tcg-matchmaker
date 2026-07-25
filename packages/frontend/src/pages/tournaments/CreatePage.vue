<template>
  <AppCard
    :title="$t('tournament.create')"
    width="600px"
    page-class="q-pa-md flex flex-center"
    body-class=""
    title-class="q-my-none"
    :error="error"
  >
    <q-form ref="formRef" class="q-gutter-sm" @submit.prevent="save">
      <q-input
        v-model="form.name"
        :label="$t('tournament.name')"
        outlined
        :rules="[(v) => !!v || 'Name is required']"
      />
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
      <q-select
        v-model="form.bracket_type"
        :options="bracketOptions"
        :label="$t('tournament.bracketType')"
        outlined
        emit-value
        map-options
      />
      <q-select
        v-model="form.best_of"
        :options="bestOfOptions"
        :label="$t('tournament.bestOf')"
        outlined
        emit-value
        map-options
      />
      <q-btn
        type="submit"
        color="primary"
        :label="$t('tournament.create')"
        class="full-width"
        :loading="saving"
      />
    </q-form>
  </AppCard>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import AppCard from '@/components/molecules/AppCard.vue';
import DateTimePicker from '@/components/molecules/DateTimePicker.vue';
import LocationAutocomplete from '@/components/molecules/fields/LocationAutocomplete.vue';
import { BRACKET_OPTIONS, BEST_OF_OPTIONS } from '@/constants/tournament';

usePageMeta({ titleKey: 'tournament.create' });

const { t } = useI18n();
const store = useEventStore();
const router = useRouter();
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);
const saving = ref(false);
const error = ref('');
const form = reactive({
  name: '',
  scheduled_at: '',
  lat: 0,
  lng: 0,
  custom_location_name: '',
  max_participants: 16,
  bracket_type: 'single_elimination',
  best_of: 1,
});

const bracketOptions = computed(() =>
  BRACKET_OPTIONS.map((o) => ({
    ...o,
    label: t(`tournament.bracketOptions.${o.value}`),
  })),
);

const bestOfOptions = computed(() =>
  BEST_OF_OPTIONS.map((o) => ({
    ...o,
    label: t(`tournament.bestOfOptions.${o.value}`),
  })),
);

async function save() {
  const valid = formRef.value ? await formRef.value.validate() : true;
  if (!valid) return;
  saving.value = true;
  error.value = '';
  try {
    await store.create({
      type: 'tournament',
      ...form,
      max_participants: Number(form.max_participants),
    });
    void router.push('/tournaments');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create tournament';
  } finally {
    saving.value = false;
  }
}
</script>
