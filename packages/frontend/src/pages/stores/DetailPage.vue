<template>
  <q-page class="q-pa-md row justify-center">
    <div v-if="store" style="width: 600px">
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <h5 class="q-my-none">{{ store.name }}</h5>
            <q-badge v-if="store.is_verified" color="positive" class="q-ml-sm">{{
              $t('store.verified')
            }}</q-badge>
          </div>
          <div class="text-caption text-grey q-mt-sm">
            {{ store.address }}, {{ store.city }}, {{ store.state }}
          </div>
        </q-card-section>
      </q-card>
      <q-card class="q-mt-md">
        <q-card-section
          ><h6>{{ $t('store.members') }}</h6></q-card-section
        >
        <q-list v-if="members.length > 0">
          <q-item v-for="m in members" :key="m.id as string">
            <q-item-section>{{ m.user_id }}</q-item-section>
            <q-item-section side
              ><q-badge>{{ (m as StoreMember).role }}</q-badge></q-item-section
            >
          </q-item>
        </q-list>
        <q-card-section v-else class="text-grey">No members</q-card-section>
      </q-card>
    </div>
    <div v-else-if="storeStore.loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStoreStore } from '@/stores/useStoreStore';
import { getApiBase } from '@/lib/api';

const route = useRoute();
type StoreMember = Record<string, string>;

const storeStore = useStoreStore();
const members = ref<Array<Record<string, unknown>>>([]);

const store = computed(() => storeStore.current as Record<string, string> | null);
const storeId = route.params.id as string;

onMounted(async () => {
  await storeStore.get(storeId);
  try {
    const r = await fetch(`${getApiBase()}/api/stores/${storeId}/members`);
    const j = await r.json();
    members.value = j.data ?? [];
  } catch {
    /* ignore */
  }
});
</script>
