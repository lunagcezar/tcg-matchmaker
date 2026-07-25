<template>
  <q-infinite-scroll :offset="250" :scroll-target="scrollTarget" @load="onLoad">
    <div v-if="items.length === 0 && !loading" class="text-center q-py-xl text-grey">
      <slot name="empty">{{ emptyText }}</slot>
    </div>
    <template v-for="item in items" :key="item.id">
      <slot name="item" :item="item" />
    </template>
    <template #loading>
      <div class="row justify-center q-my-md">
        <q-spinner color="primary" size="2rem" />
      </div>
    </template>
  </q-infinite-scroll>
</template>

<script setup lang="ts" generic="T extends { id: string }">
import { inject, computed } from 'vue';
import { MapListScrollRefKey } from '@/lib/injectionKeys';

interface Props {
  items: T[];
  loading: boolean;
  emptyText?: string;
  scrollTarget?: HTMLElement;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'load-more', index: number, done: (stop?: boolean) => void): void;
}>();

const injectedScrollRef = inject(MapListScrollRefKey, null);
const scrollTarget = computed(() => props.scrollTarget ?? injectedScrollRef?.value ?? undefined);

function onLoad(index: number, done: (stop?: boolean) => void) {
  emit('load-more', index, done);
}
</script>
