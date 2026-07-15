<template>
  <q-page class="q-pa-md row justify-center">
    <div v-if="profile" style="width: 600px">
      <q-card>
        <q-card-section class="text-center">
          <q-avatar size="80px" class="q-mb-md">
            <q-icon name="person" size="80px" />
          </q-avatar>
          <h5 class="q-my-none">{{ profile.display_name || profile.username }}</h5>
          <div class="text-caption text-grey">@{{ profile.username }}</div>
          <q-badge :color="roleColor(profile.role)" class="q-mt-sm">{{ profile.role }}</q-badge>
          <div class="text-caption text-grey q-mt-sm">{{ $t('profile.memberSince') }}: {{ formatDate(profile.created_at) }}</div>
        </q-card-section>
      </q-card>
      <q-card class="q-mt-md">
        <q-card-section><h6>{{ $t('profile.eventHistory') }}</h6></q-card-section>
        <q-card-section v-if="events.length === 0" class="text-grey">{{ $t('profile.noEvents') }}</q-card-section>
        <q-list v-else>
          <q-item v-for="e in events" :key="(e.id as string)" clickable :to="eventRoute(e)" class="q-mb-sm">
            <q-item-section>
              <q-badge :color="eventColor(e.type)" class="q-mr-sm">{{ e.type }}</q-badge>
              <div class="text-body2">{{ e.name || e.type }}</div>
              <div class="text-caption text-grey">{{ formatDate(e.scheduled_at) }}</div>
            </q-item-section>
            <q-item-section side><q-badge>{{ e.status }}</q-badge></q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
    <div v-else-if="loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>
    <div v-else class="text-center text-grey q-py-xl">{{ $t('common.noResults') }}</div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '@/stores/useEventStore';
import { usePageMeta } from '@/composables/usePageMeta';

const route = useRoute();
const username = route.params.username as string;
usePageMeta({ title: `@${username}`, description: `View ${username}'s TCG event history` });
const eventStore = useEventStore();
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const loading = ref(true);
const profile = ref<Record<string, string> | null>(null);
const events = computed(() => eventStore.items as Array<Record<string, string>>);

function formatDate(d: string | undefined) { return d ? new Date(d).toLocaleDateString() : ''; }
function roleColor(r: string | undefined) { return r === 'admin' ? 'red' : r === 'organizer' ? 'warning' : 'primary'; }
function eventColor(t: string | undefined) { return t === 'match' ? 'primary' : t === 'trading' ? 'positive' : 'warning'; }
function eventRoute(e: Record<string, string>) {
  const t = e.type; const id = e.id;
  if (t === 'match') return `/matches/${id}`;
  if (t === 'trading') return `/trading/${id}`;
  return `/tournaments/${id}`;
}

onMounted(async () => {
  loading.value = true;
  try {
    const r = await fetch(`${apiUrl}/api/auth/me`);
    const j = await r.json();
    profile.value = j.data ?? null;
    if (profile.value?.username === username) {
      await eventStore.list();
    }
  } catch { /* ignore */ }
  finally { loading.value = false; }
});
</script>
