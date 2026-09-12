<template>
  <MapListLayout :items="matches" :loading="loading" :empty-text="$t('home.noEvents')">
    <template #map>
      <EventMap :events="matches" />
    </template>
    <template #filters>
      <q-btn color="primary" icon="add" :label="$t('nav.newMatch')" to="/matches/new" />
      <q-space />
      <StatusFilterSegment v-model="statusFilter" :options="statusOptions" />
    </template>
    <template #items>
      <BaseList :items="matches" :loading="loading" @load-more="loadMore">
        <template #item="{ item }">
          <EventRow :to="eventRoute(item)">
            <StatusBadge :status="item.status" class="q-mr-sm" />
            <div class="text-body2">{{ item.tcg_name || $t('event.anyTcg') }}</div>
            <q-space />
            <div class="text-caption text-grey">{{ formatDate(item.scheduled_at) }}</div>
          </EventRow>
        </template>
      </BaseList>
    </template>
  </MapListLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import StatusBadge from '@/components/atoms/StatusBadge.vue';
import EventRow from '@/components/molecules/EventRow.vue';
import StatusFilterSegment from '@/components/molecules/StatusFilterSegment.vue';
import BaseList from '@/components/organisms/BaseList.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';
import { useFormatDate } from '@/composables/useFormatDate';
import { usePageMeta } from '@/composables/usePageMeta';
import { useStoreList } from '@/composables/useStoreList';
import MapListLayout from '@/layouts/MapListLayout.vue';
import { eventRoute } from '@/lib/router';
import { useEventStore } from '@/stores/useEventStore';

usePageMeta({ titleKey: 'meta.matches', descKey: 'meta.matchesDesc' });

const { formatDate } = useFormatDate();
const { t } = useI18n();
const store = useEventStore();
const statusFilter = ref<string>('');

const statusOptions = [
  { label: t('event.all'), value: '' },
  { label: t('event.open'), value: 'open' },
  { label: t('event.confirmed'), value: 'confirmed' },
  { label: t('event.completed'), value: 'completed' },
];

const { loadMore } = useStoreList(store, { type: 'match' });

const matches = computed(() => {
  const all = store.items;
  if (!statusFilter.value) return all;
  return all.filter((m) => m.status === statusFilter.value);
});
const loading = computed(() => store.loading);
</script>
