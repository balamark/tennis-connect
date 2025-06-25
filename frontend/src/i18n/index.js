import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

const resources = {
  'zh-TW': {
    translation: zhTW
  },
  'en': {
    translation: en
  },
  'fr': {
    translation: fr
  },
  'es': {
    translation: es
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-TW', // Traditional Chinese (Taiwan) as default
    lng: 'zh-TW', // Set default language
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false // React already does escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'], // Persist language choice
      lookupLocalStorage: 'i18nextLng',
    }
  });

export default i18n; 