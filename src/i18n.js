import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Funcție asincronă pentru a inițializa i18next
export const initI18n = async () => {
  const en = await import('./locales/en/translations.json');
  const ro = await import('./locales/ro/translations.json');

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en.default },
        ro: { translation: ro.default },
      },
      fallbackLng: 'ro',
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
};