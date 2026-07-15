import { useMeta } from 'quasar';
import { useI18n } from 'vue-i18n';

const APP_NAME = 'TCG Matchmaker';

interface PageMeta {
  titleKey?: string;
  title?: string;
  descKey?: string;
  description?: string;
  image?: string;
  type?: string;
}

export function usePageMeta(meta: PageMeta) {
  const { t } = useI18n({ useScope: 'global' });

  useMeta(() => {
    const title = meta.title || (meta.titleKey ? t(meta.titleKey) : APP_NAME);
    const description = meta.description || (meta.descKey ? t(meta.descKey) : '');
    return {
      title,
      titleTemplate: (tpl: string) => `${tpl} | ${APP_NAME}`,
      meta: {
        description: { name: 'description', content: description },
        ...(meta.type ? { 'og:type': { property: 'og:type', content: meta.type } } : {}),
        'og:title': { property: 'og:title', content: title },
        'og:description': { property: 'og:description', content: description },
        'og:image': { property: 'og:image', content: meta.image || '' },
        'twitter:card': { name: 'twitter:card', content: 'summary' },
        'twitter:title': { name: 'twitter:title', content: title },
        'twitter:description': { name: 'twitter:description', content: description },
      },
    };
  });
}
