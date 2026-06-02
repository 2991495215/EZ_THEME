import { computed } from 'vue';
import { THEME_CONFIG } from '@/utils/baseConfig';
import { useThemeStore } from '@/stores';
import { useToast } from '@/composables/useToast';

export function useTheme() {
  const themeStore = useThemeStore();
  const { showToast } = useToast();
  const theme = computed(() => themeStore.currentTheme);
  
  const toggleTheme = () => {
    const wasAutoTheme = themeStore.isAutoTheme;
    themeStore.toggleTheme();
    applyTheme(themeStore.currentTheme);
    if (wasAutoTheme) {
      showToast('已关闭主题自动切换', 'info', 3000);
    }
  };
  
  const applyTheme = (selectedTheme) => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const themeVars = THEME_CONFIG[selectedTheme];

    if (!body || !themeVars) {
      return;
    }

    if (selectedTheme === 'dark') {
      root.classList.add('dark-theme');
      body.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      body.classList.remove('dark-theme');
    }

    root.style.colorScheme = selectedTheme;
    body.offsetHeight;

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
    
    if (selectedTheme === 'dark') {

      document.querySelectorAll('.auth-card').forEach(card => {

        card.style.backgroundColor = '#1e1e1e';

        card.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.3)';

      });

    } else {

      document.querySelectorAll('.auth-card').forEach(card => {

        card.style.backgroundColor = '';

        card.style.boxShadow = '';

      });

    }

  };
  
  const syncThemeByTime = () => {
    themeStore.syncThemeByTime();
    applyTheme(themeStore.currentTheme);
  };
  
  const initTheme = () => {
    syncThemeByTime();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        applyTheme(themeStore.currentTheme);
      });
    } else {
      applyTheme(themeStore.currentTheme);
    }
  };
  
  return {

    theme,

    toggleTheme,

    applyTheme
  };

} 
