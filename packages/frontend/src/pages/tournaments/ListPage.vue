<template>
  <MapListLayout :items="tournaments" :loading="loading" :empty-text="$t('home.noEvents')">
    <template #map>
      <EventMap :events="tournaments" />
    </template>
    <template #filters>
      <q-btn
        color="primary"
        icon="add"
        :label="$t('tournament.createLabel')"
        to="/tournaments/new"
      />
      <q-space />
      <StatusFilterSegment v-model="statusFilter" :options="statusOptions" />
    </template>
    <template #items>
      <BaseList :items="tournaments" :loading="loading" @load-more="loadMore">
        <template #item="{ item }">
          <EventRow :to="eventRoute(item)">
            <StatusBadge :status="item.status" class="q-mr-sm" />
            <div class="text-body2">{{ item.name || $t('nav.tournaments') }}</div>
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
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { useFormatDate } from '@/composables/useFormatDate';
import { eventRoute } from '@/lib/router';
import MapListLayout from '@/layouts/MapListLayout.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';
import BaseList from '@/components/organisms/BaseList.vue';
import EventRow from '@/components/molecules/EventRow.vue';
import StatusFilterSegment from '@/components/molecules/StatusFilterSegment.vue';
import StatusBadge from '@/components/atoms/StatusBadge.vue';

usePageMeta({ titleKey: 'nav.tournaments', descKey: 'meta.homeDesc' });

const { t } = useI18n();
const { formatDate } = useFormatDate();
const store = useEventStore();
const statusFilter = ref<string>('');

const statusOptions = [
  { label: t('event.all'), value: '' },
  { label: t('common.status.open'), value: 'open' },
  { label: t('common.status.in_progress'), value: 'in_progress' },
  { label: t('common.status.completed'), value: 'completed' },
];

const tournaments = computed(() => {
  const all = store.items;
  if (!statusFilter.value) return all;
  return all.filter((t) => t.status === statusFilter.value);
});
const loading = computed(() => store.loading);

function loadMore(_index: number, done: (stop?: boolean) => void) {
  void store.loadMore({ type: 'tournament' }).then(() => done(!store.hasMore));
}

onMounted(() => store.list({ type: 'tournament' }));
</script>
