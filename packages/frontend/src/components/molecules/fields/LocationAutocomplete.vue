<template>
  <q-select
    v-model="selected"
    :options="results"
    :loading="loading"
    :label="label"
    outlined
    use-input
    fill-input
    hide-selected
    input-debounce="500"
    option-label="display_name"
    option-value="display_name"
    @filter="handleFilter"
    @update:model-value="handleSelect"
  >
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">{{ $t('common.noResults') }}</q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGeocode, type GeocodeResult } from '@/composables/useGeocode';

interface Props {
  label: string;
}

defineProps<Props>();

const emit = defineEmits<{
  select: [lat: number, lng: number, displayName: string];
}>();

const { results, loading, search } = useGeocode();
const selected = ref<string>('');

let filterTimer: ReturnType<typeof setTimeout> | null = null;

function handleFilter(val: string, update: (fn: () => void) => void) {
  if (val.length < 3) {
    update(() => {});
    return;
  }
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    void search(val);
    update(() => {});
  }, 300);
}

function handleSelect(val: GeocodeResult | string | null) {
  if (!val || typeof val === 'string') return;
  selected.value = val.display_name;
  emit('select', parseFloat(val.lat), parseFloat(val.lon), val.display_name);
}

function clear() {
  selected.value = '';
  search('');
}

defineExpose({ clear });
</script>
