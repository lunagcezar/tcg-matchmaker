import type { InjectionKey, Ref } from 'vue';

export const MapListScrollRefKey: InjectionKey<Ref<HTMLElement | null>> =
  Symbol('mapListScrollRef');
