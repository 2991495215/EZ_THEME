import { pinia, useAuthStore, useThemeStore, useAppStore } from '@/stores';

const getStores = () => ({
  auth: useAuthStore(pinia),
  theme: useThemeStore(pinia),
  app: useAppStore(pinia)
});

const legacyStore = {
  get state() {
    const { auth, theme, app } = getStores();
    return {
      user: auth.user,
      token: auth.token,
      theme: theme.theme,
      loading: app.loading,
      error: app.error
    };
  },
  get getters() {
    const { auth, theme } = getStores();
    return {
      isLoggedIn: auth.isLoggedIn,
      userInfo: auth.userInfo,
      currentTheme: theme.currentTheme,
      isDarkTheme: theme.isDarkTheme
    };
  },
  commit(type, payload) {
    const { auth, theme, app } = getStores();
    const mutations = {
      SET_USER: () => auth.setUser(payload),
      SET_TOKEN: () => auth.setToken(payload),
      CLEAR_USER: () => auth.clearUser(),
      SET_THEME: () => theme.setTheme(payload),
      SET_LOADING: () => app.setLoading(payload),
      SET_ERROR: () => app.setError(payload)
    };

    if (mutations[type]) {
      mutations[type]();
    }
  },
  dispatch(type, payload) {
    const { auth, theme } = getStores();
    const actions = {
      login: () => auth.setToken(payload),
      logout: async () => {
        auth.clearUser();
      },
      setUser: () => auth.setUser(payload),
      toggleTheme: () => theme.toggleTheme(),
      initUserInfo: () => auth.initUserInfo()
    };

    if (actions[type]) {
      return actions[type]();
    }

    return undefined;
  }
};

export default legacyStore;
