import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCommon from './locales/zh/common.json';
import zhSidebar from './locales/zh/sidebar.json';
import enCommon from './locales/en/common.json';
import enSidebar from './locales/en/sidebar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        common: zhCommon,
        sidebar: zhSidebar,
      },
      en: {
        common: enCommon,
        sidebar: enSidebar,
      },
    },
    fallbackLng: 'zh',
    ns: ['common', 'sidebar'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
