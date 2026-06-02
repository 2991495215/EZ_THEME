import { computed, readonly, ref } from 'vue';

const STORAGE_KEY = 'ez_performance_mode';
const CLASS_NAME = 'performance-mode';

const readInitialValue = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(STORAGE_KEY) === '1';
};

const enabled = ref(readInitialValue());

const applyClass = value => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle(CLASS_NAME, value);
  document.body?.classList.toggle(CLASS_NAME, value);
};

applyClass(enabled.value);

export const usePerformanceMode = () => {
  const setPerformanceMode = value => {
    enabled.value = Boolean(value);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, enabled.value ? '1' : '0');
    }

    applyClass(enabled.value);
  };

  const togglePerformanceMode = () => {
    setPerformanceMode(!enabled.value);
  };

  return {
    isPerformanceMode: readonly(enabled),
    performanceModeLabel: computed(() => '性能模式'),
    setPerformanceMode,
    togglePerformanceMode
  };
};
