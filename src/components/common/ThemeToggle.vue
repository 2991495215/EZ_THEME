<template>
  <button type="button" class="theme-toggle" :class="{ 'theme-toggle-dark': theme === 'dark' }" :title="$t('common.' + labels[preference])" :aria-label="$t('common.toggleTheme') + ': ' + $t('common.' + labels[preference])" @click="setTheme(nextMode[preference])">
    <Transition name="theme-icon" mode="out-in">
      <span :key="preference" class="theme-toggle-icon">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="preference === 'system' || theme === 'light'">
            <circle cx="12" cy="12" r="4" />
            <path v-if="preference === 'system'" d="M12 8a4 4 0 0 1 0 8Z" fill="currentColor" stroke="none" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
          </template>
          <path v-else d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </Transition>
  </button>
</template>

<script setup>
import { useTheme } from '@/composables/useTheme';
const { theme, preference, setTheme } = useTheme();
const labels = { system: 'themeSystem', light: 'themeLight', dark: 'themeDark' };
const nextMode = { system: 'light', light: 'dark', dark: 'system' };
</script>

<style lang="scss" scoped>
.theme-toggle {
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  box-sizing: border-box;
  border-radius: 50%;
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  overflow: hidden;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  &:hover, &:focus-visible {
    background-color: rgba(var(--theme-color-rgb), 0.1);
    border-color: var(--theme-color);
    color: var(--theme-color);
  }
  &:focus-visible {
    outline: 2px solid var(--theme-color);
    outline-offset: 2px;
  }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
  &:active {
    transform: translateY(0);
    transition-duration: 0.1s;
  }
  &-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    :deep(svg) { transition: transform 0.3s ease; }
  }
  &:hover &-icon :deep(svg) { transform: rotate(20deg); }
}
.theme-icon-enter-active, .theme-icon-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.theme-icon-enter-from, .theme-icon-leave-to {
  opacity: 0;
  transform: scale(0.7);
}
@media (prefers-reduced-motion: reduce) {
  .theme-toggle, .theme-toggle-icon :deep(svg),
  .theme-icon-enter-active, .theme-icon-leave-active {
    transition: none;
  }
  .theme-toggle:hover, .theme-toggle:hover .theme-toggle-icon :deep(svg),
  .theme-icon-enter-from, .theme-icon-leave-to {
    transform: none;
  }
}
</style>
