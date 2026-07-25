import type messages from '@/i18n';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en-US'];

export function detectLocale(): MessageLanguages {
  const storedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null;
  if (storedLocale === 'en-US' || storedLocale === 'pt-BR') {
    return storedLocale;
  }
  if (typeof navigator !== 'undefined' && navigator.language?.startsWith('pt')) {
    return 'pt-BR';
  }
  return 'en-US';
}
