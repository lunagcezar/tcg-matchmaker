import { flushPromises, shallowMount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n } from 'vue-i18n';

const mockStoreStore = vi.hoisted(() => ({
  current: null,
  loading: false,
  get: vi.fn(),
  getMembers: vi.fn(),
}));

vi.mock('@/stores/useStoreStore', () => ({ useStoreStore: vi.fn(() => mockStoreStore) }));
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { id: 'store-1' } })),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      store: { members: 'Members', noMembers: 'No members' },
    },
  },
});

const stubs = {
  'q-page': { template: '<div><slot /></div>' },
  EventMap: { template: '<div class="event-map" />' },
  StoreCard: { template: '<div class="store-card" />' },
  ParticipantListCard: { template: '<div class="participants"><slot /></div>' },
};

describe('StoreDetailPage', () => {
  beforeEach(() => {
    mockStoreStore.current = null;
    mockStoreStore.get.mockReset();
    mockStoreStore.get.mockImplementation(async () => mockStoreStore.current);
    mockStoreStore.getMembers.mockReset();
    mockStoreStore.getMembers.mockResolvedValue([]);
  });

  it('hides the members card and does not fetch members for a non-member viewer', async () => {
    mockStoreStore.current = { id: 'store-1', viewer_role: null };
    const DetailPage = (await import('../stores/DetailPage.vue')).default;
    const wrapper = shallowMount(DetailPage, { global: { plugins: [i18n], stubs } });
    await flushPromises();

    expect(mockStoreStore.get).toHaveBeenCalledWith('store-1');
    expect(mockStoreStore.getMembers).not.toHaveBeenCalled();
    expect(wrapper.find('.participants').exists()).toBe(false);
  });

  it('shows the members card and fetches members for a store member', async () => {
    mockStoreStore.current = { id: 'store-1', viewer_role: 'owner' };
    mockStoreStore.getMembers.mockResolvedValue([
      { id: 'm1', store_id: 'store-1', user_id: 'u1', role: 'owner', username: 'luna' },
    ]);
    const DetailPage = (await import('../stores/DetailPage.vue')).default;
    const wrapper = shallowMount(DetailPage, { global: { plugins: [i18n], stubs } });
    await flushPromises();

    expect(mockStoreStore.getMembers).toHaveBeenCalledWith('store-1');
    expect(wrapper.find('.participants').exists()).toBe(true);
  });
});
