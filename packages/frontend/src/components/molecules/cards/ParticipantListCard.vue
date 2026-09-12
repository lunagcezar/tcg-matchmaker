<template>
  <AppPanelCard :title="title" card-class="q-mt-md">
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
  </AppPanelCard>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/atoms/StatusBadge.vue';
import type { Participant } from '@/types/domain';

import AppPanelCard from './AppPanelCard.vue';

export type { Participant };

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
