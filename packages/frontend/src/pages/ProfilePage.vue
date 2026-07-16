<template>
  <AppDetailLayout
    :item="profile"
    :loading="loading"
    width="600px"
    show-empty
    :empty-text="$t('common.noResults')"
  >
    <q-card>
      <q-card-section class="text-center">
        <q-avatar size="80px" class="q-mb-md">
          <q-icon name="person" size="80px" />
        </q-avatar>
        <h5 class="q-my-none">{{ profile!.display_name || profile!.username }}</h5>
        <div class="text-caption text-grey">@{{ profile!.username }}</div>
        <q-badge :color="roleColor(profile!.role)" class="q-mt-sm">{{ profile!.role }}</q-badge>
        <div class="text-caption text-grey q-mt-sm">
          {{ $t('profile.memberSince') }}: {{ formatDate(profile!.created_at) }}
        </div>
      </q-card-section>
    </q-card>
    <q-card class="q-mt-md">
      <q-card-section
        ><h6>{{ $t('profile.eventHistory') }}</h6></q-card-section
      >
      <q-card-section v-if="events.length === 0" class="text-grey">{{
        $t('profile.noEvents')
      }}</q-card-section>
      <q-list v-else>
        <q-item
          v-for="e in events"
          :key="e.id as string"
          clickable
          :to="eventRoute(e)"
          class="q-mb-sm"
        >
          <q-item-section>
            <q-badge :color="eventColor(e.type)" class="q-mr-sm">{{ e.type }}</q-badge>
            <div class="text-body2">{{ e.name || e.type }}</div>
            <div class="text-caption text-grey">{{ formatDate(e.scheduled_at) }}</div>
          </q-item-section>
          <q-item-section side
            ><q-badge>{{ e.status }}</q-badge></q-item-section
          >
        </q-item>
      </q-list>
    </q-card>
  </AppDetailLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';
import { apiGet } from '@/composables/useApi';
import { formatDate } from '@/lib/format';
import { roleColor, eventColor } from '@/lib/colors';
import { eventRoute } from '@/lib/router';
import AppDetailLayout from '@/layouts/AppDetailLayout.vue';

const route = useRoute();
const username = route.params.username as string;
usePageMeta({ title: `@${username}`, description: `View ${username}'s TCG event history` });
const eventStore = useEventStore();
const loading = ref(true);
const profile = ref<Record<string, string> | null>(null);
const events = computed(() => eventStore.items);

onMounted(async () => {
  loading.value = true;
  try {
    const j = await apiGet('/api/auth/me');
    profile.value = (j.data ?? null) as Record<string, string> | null;
    if (profile.value?.username === username) {
      await eventStore.list();
    }
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
});
</script>
