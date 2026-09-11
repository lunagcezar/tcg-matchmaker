<template>
  <AppPanelCard card-class="q-mt-md">
    <template #title>
      <div class="row items-center">
        <h5 class="q-my-none">{{ store.name }}</h5>
        <q-icon
          v-if="store.is_verified"
          name="check_circle"
          color="positive"
          size="sm"
          class="q-ml-sm"
        />
      </div>
    </template>
    <q-card-section>
      <div class="text-caption text-grey">
        {{ store.address }}, {{ store.city }}, {{ store.state }}
      </div>
    </q-card-section>
  </AppPanelCard>
</template>

<script setup lang="ts">
import type { Store } from '@/types/domain';

import AppPanelCard from './AppPanelCard.vue';

interface Props {
  store: Store;
}

defineProps<Props>();
</script>
