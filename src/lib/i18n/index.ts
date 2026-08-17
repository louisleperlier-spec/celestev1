import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import fr from './locales/fr';

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'fr';
const supported = ['fr', 'en'] as const;
const initialLanguage = (supported as readonly string[]).includes(deviceLanguage) ? deviceLanguage : 'fr';

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
