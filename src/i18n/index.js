

import { createI18n } from 'vue-i18n';

import { SITE_CONFIG, DEFAULT_CONFIG } from '@/utils/baseConfig';

import { checkLoginStatus } from '@/api/auth';



const injectSiteName = (messages) => {

  Object.keys(messages).forEach(locale => {

    if (messages[locale]?.common) {

      messages[locale].common.appName = SITE_CONFIG.siteName;

      if (messages[locale].common.welcome && messages[locale].common.welcome.includes('V2Board Admin')) {

        messages[locale].common.welcome = messages[locale].common.welcome.replace('V2Board Admin', SITE_CONFIG.siteName);

      }

    }

  });

  return messages;

};



const normalizeLanguage = language => language?.startsWith('zh') ? 'zh-CN' : 'en-US';

const getBrowserLanguage = () => normalizeLanguage(
  navigator.language || navigator.userLanguage || DEFAULT_CONFIG.defaultLanguage
);

const getStoredLanguage = () => {
  const storedLanguage = localStorage.getItem('language');
  const language = storedLanguage ? normalizeLanguage(storedLanguage) : getBrowserLanguage();
  if (storedLanguage && storedLanguage !== language) localStorage.setItem('language', language);
  return language;
};

const supportedLocales = ['zh-CN', 'en-US'];

const localeLoaders = {
  'zh-CN': () => import('./locales/zh-CN.js'),
  'en-US': () => import('./locales/en-US.js'),
};
const loadLocaleMessages = async (isLoggedIn, language = getStoredLanguage()) => {
  const selected = supportedLocales.includes(language) ? language : 'en-US';
  const entries = await Promise.all([...new Set([selected, 'en-US'])].map(async locale => {
    const module = await localeLoaders[locale]();
    return [locale, module.default];
  }));
  return injectSiteName(Object.fromEntries(entries));
};

const i18n = createI18n({

  legacy: false,
  locale: getStoredLanguage(),

  fallbackLocale: 'en-US',

  messages: {},
  silentTranslationWarn: true,

  missingWarn: false,
  fallbackWarn: false
});



let languageSequence = 0;
export const setLanguage = async (lang) => {
  const sequence = ++languageSequence;

  lang = normalizeLanguage(lang);

  

  const isLoggedIn = checkLoginStatus();

  

  /*for (const locale of supportedLocales) {

    i18n.global.setLocaleMessage(locale, {});

  }*/

  

  const messages = await loadLocaleMessages(isLoggedIn, lang);
  if (sequence !== languageSequence) return { success: false };

  

  for (const locale in messages) {

    if (messages[locale]) {

      i18n.global.mergeLocaleMessage(locale, messages[locale]);

    }

  }

  

  i18n.global.locale.value = lang;

  localStorage.setItem('language', lang);

  document.querySelector('html').setAttribute('lang', lang);

  

  updatePageTitle();

  

  setTimeout(() => {

    updatePageTitle();

  }, 300);

  

  return {

    success: true,

    availableLocales: Object.keys(messages)

  };

};



export const updatePageTitle = () => {

  if (window.router?.currentRoute?.value?.meta?.titleKey) {

    const titleKey = window.router.currentRoute.value.meta.titleKey;

    try {

      const translatedTitle = i18n.global.t(titleKey);

      document.title = `${translatedTitle} - ${SITE_CONFIG.siteName}`;

    } catch (error) {

      document.title = SITE_CONFIG.siteName;

    }

  } else if (window.router?.currentRoute?.value) {

    document.title = SITE_CONFIG.siteName;

  }

};



export const reloadMessages = async () => {

  const isLoggedIn = checkLoginStatus();

  

  /*for (const locale of supportedLocales) {

    i18n.global.setLocaleMessage(locale, {});

  }*/

  

  const messages = await loadLocaleMessages(isLoggedIn, i18n.global.locale.value);

  

  const currentLang = i18n.global.locale.value;

  

  for (const locale in messages) {

    if (messages[locale]) {

      i18n.global.mergeLocaleMessage(locale, messages[locale]);

    }

  }

  

  i18n.global.locale.value = currentLang;

  

  updatePageTitle();

  

  setTimeout(() => {

    updatePageTitle();

  }, 300);

  

  return {

    success: true,

    availableLocales: Object.keys(messages)

  };

};



(async () => {

  try {

    const isLoggedIn = checkLoginStatus();

    const initialLang = getStoredLanguage();

    

    const messages = await loadLocaleMessages(isLoggedIn);

    

    for (const locale in messages) {

      if (messages[locale]) {

        i18n.global.mergeLocaleMessage(locale, messages[locale]);

      }

    }

    

    i18n.global.locale.value = initialLang;
    document.documentElement.lang = initialLang;

    

    updatePageTitle();

  } catch (error) {

  }

})();



export default i18n;
