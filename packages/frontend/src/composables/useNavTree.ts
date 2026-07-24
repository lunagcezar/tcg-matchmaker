import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ROLES } from '@tcg/shared';
import { navTree, type NavNode } from '@/router/navItems';
import { useAuthStore } from '@/stores/useAuthStore';

function isActive(node: NavNode, currentPath: string): boolean {
  if (node.exact) return currentPath === node.href;
  return currentPath === node.href || currentPath.startsWith(`${node.href}/`);
}

function hasActiveDescendant(node: NavNode, currentPath: string): boolean {
  if (isActive(node, currentPath)) return true;
  if (!node.children) return false;
  return node.children.some((child) => hasActiveDescendant(child, currentPath));
}

function filterTree(nodes: NavNode[], isAdmin: boolean): NavNode[] {
  return nodes
    .filter((node) => !node.adminOnly || isAdmin)
    .map((node) => {
      const filtered: NavNode = { ...node };
      if (node.children) {
        filtered.children = filterTree(node.children, isAdmin);
      }
      return filtered;
    });
}

export function useNavTree() {
  const route = useRoute();
  const authStore = useAuthStore();

  const isAdmin = computed(() => authStore.profile?.role === ROLES[2]);
  const currentPath = computed(() => route.path);
  const tree = computed(() => filterTree(navTree, isAdmin.value));

  function nodeIsActive(node: NavNode): boolean {
    return isActive(node, currentPath.value);
  }

  function nodeHasActiveDescendant(node: NavNode): boolean {
    return hasActiveDescendant(node, currentPath.value);
  }

  return { tree, nodeIsActive, nodeHasActiveDescendant };
}

export type { NavNode };
