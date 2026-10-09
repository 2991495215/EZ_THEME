import { watch, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { pinia, useThemeStore } from '@/stores';
import { THEME_CONFIG } from '@/utils/baseConfig';

export function useTheme() {
  const store = useThemeStore(pinia);
  const { theme, preference } = storeToRefs(store);
  const colorSchemeQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

  const applyTheme = selectedTheme => {
    const root = document.documentElement;
    const themeVars = THEME_CONFIG[selectedTheme];
    if (!themeVars) return;
    document.body.classList.toggle('dark-theme', selectedTheme === 'dark');
    root.classList.toggle('dark-theme', selectedTheme === 'dark');
    root.style.colorScheme = selectedTheme;
    root.style.setProperty('--theme-color', themeVars.primaryColor);
    root.style.setProperty('--theme-color-rgb', themeVars.primaryColorRgb);
    root.style.setProperty('--theme-hover-color', themeVars.primaryColorHover);
    root.style.setProperty('--primary-color-hover', themeVars.primaryColorHover);
    root.style.setProperty('--background-color', themeVars.backgroundColor);
    root.style.setProperty('--card-background', themeVars.cardBackground);
    root.style.setProperty('--text-color', themeVars.textColor);
    root.style.setProperty('--secondary-text-color', themeVars.secondaryTextColor);
    root.style.setProperty('--border-color', themeVars.borderColor);
    root.style.setProperty('--shadow-color', themeVars.shadowColor);
    document.querySelectorAll('.auth-card').forEach(card => {
      card.style.backgroundColor = selectedTheme === 'dark' ? '#1e1e1e' : '';
      card.style.boxShadow = selectedTheme === 'dark' ? '0 0 20px rgba(0, 0, 0, 0.3)' : '';
    });
  };

  const syncTheme = () => store.syncTheme();
  const handleStorageChange = event => {
    if (event.key === 'theme' || event.key === null) syncTheme();
  };
  watch(theme, applyTheme);
  onMounted(() => {
    syncTheme();
    applyTheme(theme.value);
    colorSchemeQuery?.addEventListener('change', syncTheme);
    window.addEventListener('storage', handleStorageChange);
  });
  onUnmounted(() => {
    colorSchemeQuery?.removeEventListener('change', syncTheme);
    window.removeEventListener('storage', handleStorageChange);
  });
  return {
    theme, preference, applyTheme,
    setTheme: value => store.setTheme(value),
    toggleTheme: () => store.toggleTheme()
  };
}
