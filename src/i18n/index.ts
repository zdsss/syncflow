import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCommon from './locales/zh/common.json';
import zhSidebar from './locales/zh/sidebar.json';
import zhDashboard from './locales/zh/dashboard.json';
import zhTodo from './locales/zh/todo.json';
import zhFiles from './locales/zh/files.json';
import zhProject from './locales/zh/project.json';
import zhConfig from './locales/zh/config.json';
import zhApproval from './locales/zh/approval.json';
import zhBom from './locales/zh/bom.json';
import zhQuery from './locales/zh/query.json';
import zhResources from './locales/zh/resources.json';
import zhKnowledge from './locales/zh/knowledge.json';
import zhTemplate from './locales/zh/template.json';
import zhPersonal from './locales/zh/personal.json';
import zhAuth from './locales/zh/auth.json';
import zhValidation from './locales/zh/validation.json';
import zhProcess from './locales/zh/process.json';
import enCommon from './locales/en/common.json';
import enSidebar from './locales/en/sidebar.json';
import enDashboard from './locales/en/dashboard.json';
import enTodo from './locales/en/todo.json';
import enFiles from './locales/en/files.json';
import enProject from './locales/en/project.json';
import enConfig from './locales/en/config.json';
import enApproval from './locales/en/approval.json';
import enBom from './locales/en/bom.json';
import enQuery from './locales/en/query.json';
import enResources from './locales/en/resources.json';
import enKnowledge from './locales/en/knowledge.json';
import enTemplate from './locales/en/template.json';
import enPersonal from './locales/en/personal.json';
import enAuth from './locales/en/auth.json';
import enValidation from './locales/en/validation.json';
import enProcess from './locales/en/process.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        common: zhCommon,
        sidebar: zhSidebar,
        dashboard: zhDashboard,
        todo: zhTodo,
        files: zhFiles,
        project: zhProject,
        config: zhConfig,
        approval: zhApproval,
        bom: zhBom,
        query: zhQuery,
        resources: zhResources,
        knowledge: zhKnowledge,
        template: zhTemplate,
        personal: zhPersonal,
        auth: zhAuth,
        validation: zhValidation,
        process: zhProcess,
      },
      en: {
        common: enCommon,
        sidebar: enSidebar,
        dashboard: enDashboard,
        todo: enTodo,
        files: enFiles,
        project: enProject,
        config: enConfig,
        approval: enApproval,
        bom: enBom,
        query: enQuery,
        resources: enResources,
        knowledge: enKnowledge,
        template: enTemplate,
        personal: enPersonal,
        auth: enAuth,
        validation: enValidation,
        process: enProcess,
      },
    },
    fallbackLng: 'zh',
    ns: ['common', 'sidebar', 'dashboard', 'todo', 'files', 'project', 'config', 'approval', 'bom', 'query', 'resources', 'knowledge', 'template', 'personal', 'auth', 'validation', 'process'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
