<template>
  <MapListLayout :items="sessions" :loading="loading" :empty-text="$t('home.noEvents')">
    <template #map>
      <EventMap :events="sessions" />
    </template>
    <template #filters>
      <q-btn color="primary" icon="add" :label="$t('nav.newTrading')" to="/trading/new" />
      <q-space />
      <StatusFilterSegment v-model="statusFilter" :options="statusOptions" />
    </template>
    <template #items>
      <BaseList :items="sessions" :loading="loading" @load-more="loadMore">
        <template #item="{ item }">
          <EventRow :to="eventRoute(item)">
            <StatusBadge :status="item.status" class="q-mr-sm" />
            <div class="text-body2">{{ item.name || 'Trading' }}</div>
            <q-space />
            <div class="text-caption text-grey">{{ formatDate(item.scheduled_at) }}</div>
          </EventRow>
        </template>
      </BaseList>
    </template>
  </MapListLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import StatusBadge from '@/components/atoms/StatusBadge.vue';
import EventRow from '@/components/molecules/EventRow.vue';
import StatusFilterSegment from '@/components/molecules/StatusFilterSegment.vue';
import BaseList from '@/components/organisms/BaseList.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';
import { useFormatDate } from '@/composables/useFormatDate';
import { usePageMeta } from '@/composables/usePageMeta';
import MapListLayout from '@/layouts/MapListLayout.vue';
import { eventRoute } from '@/lib/router';
import { useEventStore } from '@/stores/useEventStore';

usePageMeta({ titleKey: 'meta.trading', descKey: 'meta.tradingDesc' });

const { t } = useI18n();
const { formatDate } = useFormatDate();
const store = useEventStore();
const statusFilter = ref<string>('');

const statusOptions = [
  { label: t('event.all'), value: '' },
  { label: t('common.status.planned'), value: 'planned' },
  { label: t('common.status.active'), value: 'active' },
  { label: t('common.status.completed'), value: 'completed' },
];

const sessions = computed(() => {
  const all = store.items;
  if (!statusFilter.value) return all;
  return all.filter((s) => s.status === statusFilter.value);
});
const loading = computed(() => store.loading);

function loadMore(_index: number, done: (stop?: boolean) => void) {
  void store.loadMore({ type: 'trading' }).then(() => done(!store.hasMore));
}

onMounted(() => store.list({ type: 'trading' }));
</script>
