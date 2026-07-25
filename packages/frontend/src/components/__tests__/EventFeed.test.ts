import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import EventFeed from '../organisms/home/EventFeed.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: { 'en-US': { home: { noEvents: 'No events nearby' } } },
});

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/matches/:id', name: 'match', component: {} as never },
    { path: '/trading/:id', name: 'trading', component: {} as never },
    { path: '/tournaments/:id', name: 'tournament', component: {} as never },
  ],
});

describe('EventFeed', () => {
  it('renders events and emits loadMore from q-infinite-scroll', async () => {
    const wrapper = shallowMount(EventFeed, {
      props: {
        events: [{ id: '1', type: 'match', name: 'Test', scheduled_at: '2026-07-20T10:00:00Z' }],
      },
      global: {
        plugins: [i18n, router, createPinia()],
        stubs: ['q-infinite-scroll', 'q-badge', 'q-space', 'q-spinner'],
      },
    });
    expect(wrapper.exists()).toBe(true);

    const infiniteScroll = wrapper.findComponent({ name: 'q-infinite-scroll' });
    const done = vi.fn();
    await infiniteScroll.vm.$emit('load', 1, done);
    expect(wrapper.emitted('loadMore')).toBeTruthy();
  });
});
