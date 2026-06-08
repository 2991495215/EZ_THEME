import { THEME_CONFIG } from '@/utils/baseConfig';

const getThemeVars = (selectedTheme) => THEME_CONFIG[selectedTheme] || THEME_CONFIG.light;

const getThemeOverrides = (selectedTheme) => {
  if (selectedTheme === 'dark') {
    return {
      '--card-background': 'rgba(15, 20, 36, 0.78)',
      '--card-background-rgb': '15, 20, 36',
      '--text-color': 'rgba(255, 255, 255, 0.92)',
      '--text-color-rgb': '255, 255, 255',
      '--primary-text-color': 'rgba(255, 255, 255, 0.92)',
      '--secondary-text-color': 'rgba(255, 255, 255, 0.72)',
      '--border-color': 'rgba(255, 255, 255, 0.09)',
      '--shadow-color': 'rgba(0, 0, 0, 0.45)',
      '--input-bg-color': 'rgba(255, 255, 255, 0.07)',
      '--input-focus-bg-color': 'rgba(255, 255, 255, 0.1)',
      '--input-border-color': 'rgba(255, 255, 255, 0.12)',
      '--placeholder-color': 'rgba(255, 255, 255, 0.48)'
    };
  }

  return {
    '--card-background': themeVarsFallback('cardBackground', '#ffffff'),
    '--card-background-rgb': '255, 255, 255',
    '--text-color': themeVarsFallback('textColor', '#333333'),
    '--text-color-rgb': '51, 51, 51',
    '--primary-text-color': themeVarsFallback('textColor', '#333333'),
    '--secondary-text-color': themeVarsFallback('secondaryTextColor', '#666666'),
    '--border-color': themeVarsFallback('borderColor', '#e8e8e8'),
    '--shadow-color': themeVarsFallback('shadowColor', 'rgba(0, 0, 0, 0.1)'),
    '--input-bg-color': 'rgba(255, 255, 255, 0.38)',
    '--input-focus-bg-color': 'rgba(255, 255, 255, 0.58)',
    '--input-border-color': 'rgba(255, 255, 255, 0.58)',
    '--placeholder-color': 'rgba(51, 51, 51, 0.45)'
  };
};

const themeVarsFallback = (key, fallback) => {
  const lightVars = getThemeVars('light');
  return lightVars?.[key] || fallback;
};

const setThemeProperty = (element, name, value) => {
  element?.style.setProperty(name, value);
};

export const applyThemeToDocument = (selectedTheme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const body = document.body;
  const themeVars = getThemeVars(selectedTheme);
  const overrides = getThemeOverrides(selectedTheme);
  const isDarkTheme = selectedTheme === 'dark';

  root.classList.toggle('dark-theme', isDarkTheme);
  root.style.colorScheme = selectedTheme;

  if (body) {
    body.classList.toggle('dark-theme', isDarkTheme);
  }

  const themeProperties = {
    '--theme-color': themeVars.primaryColor,
    '--theme-color-rgb': themeVars.primaryColorRgb,
    '--theme-hover-color': themeVars.primaryColorHover,
    '--primary-color-hover': themeVars.primaryColorHover,
    '--primary-color-focus': themeVars.primaryColorFocus,
    '--background-color': themeVars.backgroundColor,
    ...overrides
  };

  Object.entries(themeProperties).forEach(([name, value]) => {
    setThemeProperty(root, name, value);
    setThemeProperty(body, name, value);
  });
};
