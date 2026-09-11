<template>
  <q-card>
    <q-card-section>
      <h5 class="q-my-none">{{ title }}</h5>
      <StatusBadge :status="status" class="q-mt-sm" />
    </q-card-section>
    <q-card-section v-if="$slots.default">
      <slot />
    </q-card-section>
    <q-card-actions class="q-pa-md q-gutter-sm">
      <q-btn
        v-if="participation?.status === 'pending'"
        color="positive"
        :label="$t('event.confirm')"
        :loading="confirming"
        @click="$emit('confirm')"
      />
      <q-btn
        v-if="participation?.status === 'pending'"
        color="negative"
        flat
        :label="$t('event.decline')"
        :loading="declining"
        @click="$emit('decline')"
      />
      <q-badge v-if="participation?.status === 'confirmed'" color="positive">{{
        $t('event.confirmed')
      }}</q-badge>
      <slot name="actions" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/atoms/StatusBadge.vue';

export interface Participation {
  user_id?: string;
  status?: string;
}

interface Props {
  title: string;
  status: string;
  participation: Participation | null;
  confirming?: boolean;
  declining?: boolean;
}

withDefaults(defineProps<Props>(), {
  confirming: false,
  declining: false,
});

defineEmits<{
  (e: 'confirm'): void;
  (e: 'decline'): void;
}>();
</script>
