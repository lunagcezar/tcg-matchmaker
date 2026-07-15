import { useMeta } from 'quasar';

interface PageMeta {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

export function usePageMeta(meta: PageMeta) {
  useMeta({
    title: meta.title || 'TCG Matchmaker',
    titleTemplate: (title: string) => `${title} | TCG Matchmaker`,
    meta: {
      description: { name: 'description', content: meta.description || 'Find TCG matches, trading sessions, and tournaments near you' },
      ...(meta.type ? { 'og:type': { property: 'og:type', content: meta.type } } : {}),
      'og:title': { property: 'og:title', content: meta.title || 'TCG Matchmaker' },
      'og:description': { property: 'og:description', content: meta.description || '' },
      'og:image': { property: 'og:image', content: meta.image || '' },
      'twitter:card': { name: 'twitter:card', content: 'summary' },
      'twitter:title': { name: 'twitter:title', content: meta.title || 'TCG Matchmaker' },
      'twitter:description': { name: 'twitter:description', content: meta.description || '' },
    },
  });
}
