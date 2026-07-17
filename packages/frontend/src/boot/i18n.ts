import { defineBoot } from '#q-app';
import { createI18n } from 'vue-i18n';

import messages from '@/i18n';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en-US'];

/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
  export interface DefineDateTimeFormat {}
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export default defineBoot(({ app }) => {
  const storedLocale =
    localStorage.getItem('locale') || navigator.language.startsWith('pt') ? 'pt-BR' : 'en-US';

  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale: storedLocale,
    legacy: false,
    messages,
  });

  app.use(i18n);
});
