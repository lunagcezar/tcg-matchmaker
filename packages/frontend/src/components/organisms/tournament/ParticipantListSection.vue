<template>
  <q-card class="q-mt-md">
    <q-card-section>
      <h6>{{ $t('tournament.checkIn') }}</h6>
    </q-card-section>
    <q-card-section class="row q-col-gutter-sm">
      <q-input v-model="userId" label="User ID" outlined dense class="col" />
      <q-btn color="positive" :label="$t('tournament.checkIn')" class="col-auto" @click="checkIn" />
    </q-card-section>
    <q-list>
      <q-item v-for="p in participants" :key="p.id">
        <q-item-section>{{ p.user_id?.slice(0, 8) }}</q-item-section>
        <q-item-section side><StatusBadge :status="p.status" /></q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StatusBadge from '@/components/atoms/StatusBadge.vue';

export interface Participant {
  id: string;
  user_id?: string;
  status: string;
}

interface Props {
  participants: Participant[];
}

defineProps<Props>();
const emit = defineEmits<{ (e: 'check-in', userId: string): void }>();

const userId = ref('');

function checkIn() {
  if (!userId.value) return;
  emit('check-in', userId.value);
  userId.value = '';
}
</script>
