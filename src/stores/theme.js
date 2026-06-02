import { defineStore } from 'pinia';

const getTimeBasedTheme = () => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
};

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: localStorage.getItem('theme') || getTimeBasedTheme(),
    themeMode: localStorage.getItem('themeMode') || 'auto'
  }),
  getters: {
    currentTheme: state => state.theme,
    isDarkTheme: state => state.theme === 'dark',
    isAutoTheme: state => state.themeMode === 'auto'
  },
  actions: {
    setTheme(theme, mode = this.themeMode) {
      this.theme = theme;
      this.themeMode = mode;
      localStorage.setItem('theme', theme);
      localStorage.setItem('themeMode', mode);
    },
    toggleTheme() {
      this.setTheme(this.theme === 'light' ? 'dark' : 'light', 'manual');
    },
    syncThemeByTime() {
      if (!this.isAutoTheme) {
        return;
      }
      this.setTheme(getTimeBasedTheme(), 'auto');
    },
    setAutoTheme(enabled) {
      if (enabled) {
        this.setTheme(getTimeBasedTheme(), 'auto');
      } else {
        this.setTheme(this.theme, 'manual');
      }
    }
  }
});
