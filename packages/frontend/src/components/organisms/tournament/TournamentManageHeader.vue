<template>
  <q-card>
    <q-card-section>
      <h5 class="q-my-none">{{ $t('tournament.manage') }}: {{ tournament?.name }}</h5>
      <StatusBadge v-if="tournament" :status="tournament.status || ''" class="q-mt-sm" />
    </q-card-section>
    <q-card-actions class="q-pa-md q-gutter-sm">
      <q-btn
        v-if="tournament?.status === 'draft'"
        color="primary"
        :label="$t('tournament.publish')"
        :loading="loading"
        @click="$emit('publish')"
      />
      <q-btn
        v-if="tournament?.status === 'open'"
        color="warning"
        :label="$t('tournament.start')"
        :loading="loading"
        @click="$emit('start')"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/atoms/StatusBadge.vue';

interface Props {
  tournament: Record<string, string> | null;
  loading: boolean;
}

defineProps<Props>();
defineEmits<{ (e: 'publish'): void; (e: 'start'): void }>();
</script>
