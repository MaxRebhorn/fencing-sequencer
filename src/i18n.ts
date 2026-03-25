import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslations from './locales/en/translation.json';
import deTranslations from './locales/de/translation.json';

// Define resources type
const resources = {
en: {
translation: enTranslations
},
de: {
translation: deTranslations
}
} as const;

i18n
.use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Important for preventing suspense issues
    },
  })
  .catch((error) => {
    console.error('i18n initialization error:', error);
  });

export default i18n;