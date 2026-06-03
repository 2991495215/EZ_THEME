window.__VUE_OPTIONS_API__ = true;
window.__VUE_PROD_DEVTOOLS__ = false;
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { pinia, useAuthStore } from './stores';
import i18n, { reloadMessages } from './i18n';
import { useToast } from './composables/useToast';
import initPageTitle from './utils/exposeConfig';
import { handleUnauthorizedDomain } from './utils/domainChecker';
import { getWebsiteConfig } from './api/auth';

const getInitialTheme = () => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
};

const applyInitialTheme = () => {
  const theme = getInitialTheme();
  document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
};

applyInitialTheme();


if (!handleUnauthorizedDomain()) {
  throw new Error('Unauthorized domain');
}

const initApp = async () => {
  try {
    try {
      await getWebsiteConfig();
      await reloadMessages();
    } catch (error) {
    }

    initPageTitle();

    await import('./assets/styles/index.scss');

    const app = createApp(App);

    const toast = useToast();
    const toastProvider = {
      ...toast,
      success: toast.showToast.success,
      error: toast.showToast.error,
      warning: toast.showToast.warning,
      info: toast.showToast.info
    };

    app.provide('$toast', toastProvider);

    app.use(pinia)
       .use(router)
       .use(i18n);

    app.mount('#app');

    useAuthStore().initUserInfo();
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
};

initApp();

window.router = router;
