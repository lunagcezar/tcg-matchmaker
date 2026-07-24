<template>
  <div class="filter-bar">
    <FilterToggle v-model="selectedTypes" :options="typeOptions" />
    <q-btn
      flat
      dense
      icon="my_location"
      :label="$t('home.findNearMe')"
      @click="$emit('geolocate')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FilterToggle from '@/components/molecules/FilterToggle.vue';

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void; (e: 'geolocate'): void }>();

const selectedTypes = computed({
  get: () => props.modelValue,
  set: (v: string[]) => {
    const added = v.find((x) => !props.modelValue.includes(x));
    if (added === '') {
      emit('update:modelValue', ['']);
    } else if (added) {
      emit('update:modelValue', [added]);
    } else if (v.length === 0) {
      emit('update:modelValue', ['']);
    } else {
      emit('update:modelValue', v);
    }
  },
});

const typeOptions = [
  { label: 'All', value: '' },
  { label: 'Matches', value: 'match' },
  { label: 'Trading', value: 'trading' },
  { label: 'Tournaments', value: 'tournament' },
];
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
