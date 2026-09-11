<template>
  <q-card class="q-mt-md">
    <q-card-section>
      <h6 class="q-my-none">{{ title }}</h6>
    </q-card-section>
    <q-card-section v-if="participants.length === 0 && emptyText" class="text-grey">
      {{ emptyText }}
    </q-card-section>
    <q-list v-else-if="participants.length > 0">
      <q-item v-for="p in participants" :key="p.id">
        <q-item-section>{{ p.username || p.user_id?.slice(0, 8) }}</q-item-section>
        <q-item-section side>
          <StatusBadge v-if="badgeKey === 'status'" :status="p.status || ''" />
          <q-badge v-else>{{ p.role }}</q-badge>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/atoms/StatusBadge.vue';

export interface Participant {
  id: string;
  user_id?: string;
  username?: string;
  status?: string;
  role?: string;
}

interface Props {
  title: string;
  participants: Participant[];
  badgeKey?: 'status' | 'role';
  emptyText?: string;
}

withDefaults(defineProps<Props>(), {
  badgeKey: 'status',
  emptyText: '',
});
</script>
