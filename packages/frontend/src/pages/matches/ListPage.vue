<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-my-none">{{ $t('nav.matches') }}</h5>
      <q-btn color="primary" icon="add" :label="$t('nav.newMatch')" to="/matches/new" />
    </div>
    <q-btn-toggle v-model="statusFilter" :options="statusOptions" outline rounded class="q-mb-md" />
    <div v-if="loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>
    <div v-else>
      <q-card
        v-for="m in matches"
        :key="m.id as string"
        clickable
        :to="`/matches/${m.id}`"
        class="q-mb-sm"
      >
        <q-card-section class="q-py-sm row items-center">
          <q-badge color="primary" class="q-mr-sm">{{ m.status }}</q-badge>
          <div class="text-body2">
            {{ (m as unknown as MatchListItem).tcg_name || $t('event.anyTcg') }}
          </div>
          <q-space />
          <div class="text-caption text-grey">
            {{ formatDate((m as unknown as MatchListItem).scheduled_at) }}
          </div>
        </q-card-section>
      </q-card>
      <div v-if="matches.length === 0" class="text-center text-grey q-py-xl">
        {{ $t('common.noResults') }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { formatDate } from '@/lib/format';

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
