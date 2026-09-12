import { defineStore } from 'pinia';

import { apiPost } from '@/composables/useApi';
import { useCrudResource } from '@/composables/useCrudResource';
import type { Event } from '@/types/domain';

export const useEventStore = defineStore('events', () => {
  const base = useCrudResource<Event>({ endpoint: '/api/events' });

  async function join(id: string) {
    const j = await apiPost(`/api/events/${id}/join`);
    return j.data;
  }

  async function confirm(id: string) {
    const j = await apiPost(`/api/events/${id}/confirm`);
    return j.data;
  }

  async function decline(id: string) {
    const j = await apiPost(`/api/events/${id}/decline`);
    return j.data;
  }

  return { ...base, join, confirm, decline };
});
