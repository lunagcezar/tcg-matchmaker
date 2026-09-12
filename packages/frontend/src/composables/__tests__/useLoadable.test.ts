import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { defineComponent } from 'vue';

import { useLoadable } from '../useLoadable';

describe('useLoadable', () => {
  it('starts with the initial value', () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    const { data } = useLoadable(fetcher, [] as string[]);
    expect(data.value).toEqual([]);
  });

  it('assigns the fetched result and toggles loading', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a', 'b']);
    const { data, loading, load } = useLoadable(fetcher, [] as string[]);

    const pending = load();
    expect(loading.value).toBe(true);
    await pending;

    expect(data.value).toEqual(['a', 'b']);
    expect(loading.value).toBe(false);
  });

  it('auto-loads on mount when used inside a component', async () => {
    const fetcher = vi.fn().mockResolvedValue(['x']);
    let result: ReturnType<typeof useLoadable<string[]>> | undefined;

    const wrapper = mount(
      defineComponent({
        setup() {
          result = useLoadable(fetcher, [] as string[]);
          return () => null;
        },
      }),
    );
    await wrapper.vm.$nextTick();

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result!.data.value).toEqual(['x']);
  });

  it('does not auto-load when called outside a component', () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    useLoadable(fetcher, [] as string[]);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
