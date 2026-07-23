<template>
  <AppListLayout :title="$t('nav.matches')" :loading="loading" :empty="matches.length === 0">
    <template #actions>
      <q-btn color="primary" icon="add" :label="$t('nav.newMatch')" to="/matches/new" />
    </template>
    <template #filters>
      <FilterToggle v-model="statusFilter" :options="statusOptions" class="q-mb-md" />
    </template>
    <router-link
      v-for="m in matches"
      :key="m.id as string"
      :to="`/matches/${m.id}`"
      class="list-item"
    >
      <q-badge color="primary" class="q-mr-sm">{{ m.status }}</q-badge>
      <div class="text-body2">
        {{ (m as unknown as MatchListItem).tcg_name || $t('event.anyTcg') }}
      </div>
      <q-space />
      <div class="text-caption text-grey">
        {{ formatDate((m as unknown as MatchListItem).scheduled_at) }}
      </div>
    </router-link>
  </AppListLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { formatDate } from '@/lib/format';
import AppListLayout from '@/layouts/AppListLayout.vue';
import FilterToggle from '@/components/molecules/FilterToggle.vue';

usePageMeta({ titleKey: 'meta.matches', descKey: 'meta.matchesDesc' });

type MatchListItem = Record<string, string | undefined>;

const store = useEventStore();
const statusFilter = ref<string>('');
const { t } = useI18n();
const statusOptions = [
  { label: t('event.all'), value: '' },
  { label: t('event.open'), value: 'open' },
  { label: t('event.confirmed'), value: 'confirmed' },
  { label: t('event.completed'), value: 'completed' },
];

const matches = computed(() => {
  const all = store.items;
  if (!statusFilter.value) return all;
  return all.filter((m) => m.status === statusFilter.value);
});
const loading = computed(() => store.loading);

onMounted(() => store.list({ type: 'match' }));
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
