import { defineStore } from 'pinia';

const readPreference = () => {
  const saved = localStorage.getItem('theme');
  return saved === 'light' || saved === 'dark' ? saved : 'system';
};
const resolveTheme = preference => preference === 'system'
  ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  : preference;

export const useThemeStore = defineStore('theme', {
  state: () => {
    const preference = readPreference();
    return { preference, theme: resolveTheme(preference) };
  },
  getters: {
    currentTheme: state => state.theme,
    isDarkTheme: state => state.theme === 'dark'
  },
  actions: {
    setTheme(theme) {
      if (!['system', 'light', 'dark'].includes(theme)) return;
      if (theme === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', theme);
      this.syncTheme();
    },
    syncTheme() {
      this.preference = readPreference();
      this.theme = resolveTheme(this.preference);
    },
    toggleTheme() {
      this.setTheme(this.theme === 'light' ? 'dark' : 'light');
    }
  }
});
