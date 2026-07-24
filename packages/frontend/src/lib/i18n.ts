import type messages from '@/i18n';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en-US'];

export function detectLocale(): MessageLanguages {
  const storedLocale = localStorage.getItem('locale');
  if (storedLocale === 'en-US' || storedLocale === 'pt-BR') {
    return storedLocale;
  }
  return navigator.language.startsWith('pt') ? 'pt-BR' : 'en-US';
}
