import { defineBoot } from '#q-app';
import { createI18n } from 'vue-i18n';

import messages from '@/i18n';
import { detectLocale, type MessageLanguages, type MessageSchema } from '@/lib/i18n';

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
  export interface DefineDateTimeFormat {}
  export interface DefineNumberFormat {}
}

export default defineBoot(({ app }) => {
  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale: detectLocale(),
    fallbackLocale: 'en-US',
    legacy: false,
    messages,
  });

  app.use(i18n);
});
