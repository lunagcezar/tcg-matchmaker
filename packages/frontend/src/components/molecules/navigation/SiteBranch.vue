<template>
  <li>
    <router-link
      :to="node.href"
      :class="['app-nav-link', { 'app-nav-link--active': active }]"
      @click="handleClick"
    >
      {{ $t(node.labelKey) }}
    </router-link>
    <ul v-if="hasChildren && expanded" class="app-nav-children">
      <SiteBranch
        v-for="child in node.children"
        :key="child.href"
        :node="child"
        :depth="depth + 1"
        @navigate="$emit('navigate')"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { NavNode } from '@/router/navItems';

interface Props {
  node: NavNode;
  depth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
});

const emit = defineEmits<{ (e: 'navigate'): void }>();

const route = useRoute();

function pathIsActive(node: NavNode): boolean {
  const currentPath = route.path;
  if (node.exact) return currentPath === node.href;
  return currentPath === node.href || currentPath.startsWith(`${node.href}/`);
}

function pathHasActiveDescendant(node: NavNode): boolean {
  if (pathIsActive(node)) return true;
  if (!node.children) return false;
  return node.children.some(pathHasActiveDescendant);
}

const active = computed(() => pathIsActive(props.node));
const expanded = computed(() => pathHasActiveDescendant(props.node));
const hasChildren = computed(() => (props.node.children?.length ?? 0) > 0);

function handleClick() {
  emit('navigate');
}
</script>

<script lang="ts">
export default {
  name: 'SiteBranch',
};
</script>
