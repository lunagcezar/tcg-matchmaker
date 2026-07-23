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
    <router-link
      v-for="t in tournaments"
      :key="t.id as string"
      :to="`/tournaments/${t.id}`"
      class="list-item"
    >
      <q-badge :color="badgeColor(t.status)" class="q-mr-sm">{{ t.status }}</q-badge>
      <div class="text-body2">{{ t.name || $t('nav.tournaments') }}</div>
      <q-space />
      <div class="text-caption text-grey">{{ formatDate(t.scheduled_at) }}</div>
    </router-link>
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

<style scoped>
.list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--foreground);
  text-decoration: none;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s ease;
}

.list-item:hover {
  background-color: var(--muted);
}
</style>
