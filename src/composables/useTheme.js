import { computed } from 'vue';
import { useThemeStore } from '@/stores';
import { useToast } from '@/composables/useToast';
import { applyThemeToDocument } from '@/utils/themeApplier';

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

    applyThemeToDocument(selectedTheme);
    document.body?.offsetHeight;

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
