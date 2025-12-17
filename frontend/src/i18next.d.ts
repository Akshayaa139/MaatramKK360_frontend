import 'i18next';
import en from './locales/en.json';
import ta from './locales/ta.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      en: typeof en;
      ta: typeof ta;
    };
  }
}
import { resources, defaultNS } from './config/i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: typeof resources['en'];
  }
}