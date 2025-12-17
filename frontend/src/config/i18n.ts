import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '../locales/en.json';
import taTranslations from '../locales/ta.json';

// the translations
export const resources = {
  en: {
    translation: enTranslations
  },
  ta: {
    translation: taTranslations
  }
} as const;

export const defaultNS = 'translation';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
      cookieMinutes: 10080, // 7 days
    },

    interpolation: {
      escapeValue: false, // react already safes from xss
    },

    react: {
      useSuspense: true,
    }
  });

export default i18n;