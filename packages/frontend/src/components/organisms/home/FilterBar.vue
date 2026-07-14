<template>
  <div class="filter-bar row items-center q-gutter-sm q-pa-sm">
    <q-btn-toggle
      v-model="selectedTypes"
      :options="typeOptions"
      spread
      outline
      rounded
      multiple
      color="primary"
    />
    <q-btn flat dense icon="my_location" :label="$t('home.findNearMe')" @click="$emit('geolocate')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void; (e: 'geolocate'): void }>();

const selectedTypes = computed({
  get: () => props.modelValue,
  set: (v: string[]) => emit('update:modelValue', v),
});

const typeOptions = [
  { label: 'Matches', value: 'match' },
  { label: 'Trading', value: 'trading' },
  { label: 'Tournaments', value: 'tournament' },
];
</script>
