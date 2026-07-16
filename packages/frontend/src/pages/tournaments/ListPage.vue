<template>
  <AppListLayout
    :title="$t('nav.tournaments')"
    :loading="loading"
    :empty="tournaments.length === 0"
  >
    <template #actions>
      <q-btn
        color="warning"
        icon="add"
        :label="$t('tournament.createLabel')"
        to="/tournaments/new"
      />
    </template>
    <q-card
      v-for="t in tournaments"
      :key="t.id as string"
      clickable
      :to="`/tournaments/${t.id}`"
      class="q-mb-sm"
    >
      <q-card-section class="q-py-sm row items-center">
        <q-badge :color="badgeColor(t.status)" class="q-mr-sm">{{ t.status }}</q-badge>
        <div class="text-body2">{{ t.name || $t('nav.tournaments') }}</div>
        <q-space />
        <div class="text-caption text-grey">{{ formatDate(t.scheduled_at) }}</div>
      </q-card-section>
    </q-card>
  </AppListLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { formatDate } from '@/lib/format';
import AppListLayout from '@/layouts/AppListLayout.vue';

usePageMeta({ titleKey: 'nav.tournaments', descKey: 'meta.homeDesc' });

const store = useEventStore();
const tournaments = computed(() => store.items);
const loading = computed(() => store.loading);

function badgeColor(s: string | undefined) {
  return s === 'in_progress' ? 'warning' : s === 'completed' ? 'positive' : 'primary';
}
onMounted(() => store.list({ type: 'tournament' }));
</script>
