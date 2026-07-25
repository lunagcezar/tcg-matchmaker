<template>
  <MapListLayout :items="tournaments" :loading="loading" :empty-text="$t('home.noEvents')">
    <template #map>
      <EventMap :events="tournaments" />
    </template>
    <template #filters>
      <q-btn
        color="warning"
        icon="add"
        :label="$t('tournament.createLabel')"
        to="/tournaments/new"
      />
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
import { computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { useFormatDate } from '@/composables/useFormatDate';
import { eventRoute } from '@/lib/router';
import MapListLayout from '@/layouts/MapListLayout.vue';
import EventMap from '@/components/organisms/home/EventMap.vue';
import BaseList from '@/components/organisms/BaseList.vue';
import EventRow from '@/components/molecules/EventRow.vue';
import StatusBadge from '@/components/atoms/StatusBadge.vue';

usePageMeta({ titleKey: 'nav.tournaments', descKey: 'meta.homeDesc' });

const { formatDate } = useFormatDate();
const store = useEventStore();
const tournaments = computed(() => store.items);
const loading = computed(() => store.loading);

function loadMore(_index: number, done: (stop?: boolean) => void) {
  void store.loadMore({ type: 'tournament' }).then(() => done(!store.hasMore));
}

onMounted(() => store.list({ type: 'tournament' }));
</script>
