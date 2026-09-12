import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { defineComponent } from 'vue';

import { useStoreList } from '../useStoreList';

function fakeSource(hasMore = true) {
  return {
    hasMore,
    list: vi.fn().mockResolvedValue(undefined),
    loadMore: vi.fn().mockResolvedValue(undefined),
  };
}

describe('useStoreList', () => {
  it('calls source.list with params on mount', async () => {
    const source = fakeSource();
    let loadMore: ReturnType<typeof useStoreList>['loadMore'] | undefined;

    const wrapper = mount(
      defineComponent({
        setup() {
          ({ loadMore } = useStoreList(source, { type: 'match' }));
          return () => null;
        },
      }),
    );
    await wrapper.vm.$nextTick();

    expect(source.list).toHaveBeenCalledWith({ type: 'match' });
    expect(loadMore).toBeTypeOf('function');
  });

  it('does not auto-list when called outside a component', () => {
    const source = fakeSource();
    useStoreList(source);
    expect(source.list).not.toHaveBeenCalled();
  });

  it('resolves done with the inverse of hasMore', async () => {
    const source = fakeSource(false);
    const { loadMore } = useStoreList(source);

    const done = vi.fn();
    await loadMore(0, done);

    expect(source.loadMore).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledWith(true);
  });
});
