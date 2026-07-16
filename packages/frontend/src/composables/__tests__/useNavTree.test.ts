import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavTree } from '@/composables/useNavTree';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const mockRoutePath = ref('/');
const mockProfile = ref<Record<string, unknown> | null>(null);

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ path: mockRoutePath.value })),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({ profile: mockProfile.value })),
}));

describe('useNavTree', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRoutePath.value = '/';
    mockProfile.value = null;
  });

  it('returns public nav nodes for non-admin user', () => {
    mockProfile.value = { role: 'player' };
    const { tree } = useNavTree();
    const labels = tree.value.map((n) => n.labelKey);
    expect(labels).toContain('nav.home');
    expect(labels).toContain('nav.matches');
    expect(labels).not.toContain('nav.admin');
  });

  it('includes admin branch for admin user', () => {
    mockProfile.value = { role: 'admin' };
    const { tree } = useNavTree();
    const adminNode = tree.value.find((n) => n.labelKey === 'nav.admin');
    expect(adminNode).toBeDefined();
    expect(adminNode?.children?.length).toBeGreaterThan(0);
  });

  it('detects active route and active descendant', () => {
    mockRoutePath.value = '/admin/users';
    mockProfile.value = { role: 'admin' };
    const { tree, nodeIsActive, nodeHasActiveDescendant } = useNavTree();
    const adminNode = tree.value.find((n) => n.labelKey === 'nav.admin')!;
    expect(nodeIsActive(adminNode)).toBe(true);
    expect(nodeHasActiveDescendant(adminNode)).toBe(true);
  });
});
