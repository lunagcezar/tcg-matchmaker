import { ref, type Ref } from 'vue';

import { apiGet } from '@/composables/useApi';
import type { Participant } from '@/types/domain';

export interface ParticipantsState {
  participants: Ref<Participant[]>;
  loading: Ref<boolean>;
  loadParticipants: () => Promise<void>;
}

export function useParticipants(entityId: string): ParticipantsState {
  const participants = ref<Participant[]>([]) as Ref<Participant[]>;
  const loading = ref(false);

  async function loadParticipants() {
    loading.value = true;
    try {
      const j = await apiGet(`/api/events/${entityId}/participants`);
      participants.value = (j.data ?? []) as Participant[];
    } catch {
      /* ignore — detail pages render an empty list on failure */
    } finally {
      loading.value = false;
    }
  }

  return { participants, loading, loadParticipants };
}
