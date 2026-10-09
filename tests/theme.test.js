import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { createPinia } from 'pinia';
import { useThemeStore } from '../src/stores/theme';

let dark;
beforeEach(() => {
  localStorage.clear();
  dark = false;
  vi.stubGlobal('window', { matchMedia: () => ({ matches: dark }) });
});
afterEach(() => vi.unstubAllGlobals());
const store = () => useThemeStore(createPinia());

test('new visitors follow system changes in both directions', () => {
  const theme = store();
  expect(theme.preference).toBe('system');
  expect(theme.theme).toBe('light');
  dark = true;
  theme.syncTheme();
  expect(theme.theme).toBe('dark');
  dark = false;
  theme.syncTheme();
  expect(theme.theme).toBe('light');
  expect(localStorage.getItem('theme')).toBeNull();
});

test('manual preferences survive refresh and system changes; system restores automatic mode immediately', () => {
  dark = true;
  const theme = store();
  theme.setTheme('light');
  expect(store().theme).toBe('light');
  theme.syncTheme();
  expect(theme.theme).toBe('light');
  theme.setTheme('system');
  expect(theme.preference).toBe('system');
  expect(theme.theme).toBe('dark');
  expect(localStorage.getItem('theme')).toBeNull();
  expect(store().preference).toBe('system');
  dark = false;
  theme.syncTheme();
  expect(theme.theme).toBe('light');
  theme.setTheme('dark');
  expect(store().theme).toBe('dark');
});

test('legacy preferences persist; invalid saved values fall back to system', () => {
  for (const value of ['light', 'dark']) {
    localStorage.setItem('theme', value);
    expect(store().preference).toBe(value);
    expect(store().theme).toBe(value);
  }
  for (const value of ['system', 'invalid']) {
    localStorage.setItem('theme', value);
    dark = true;
    expect(store().theme).toBe('dark');
    expect(store().preference).toBe('system');
  }
  const theme = store();
  theme.setTheme('invalid');
  expect(theme.theme).toBe('dark');
});

test('cross-tab changes synchronize preferences and the resolved theme', () => {
  const theme = store();
  localStorage.setItem('theme', 'dark');
  theme.syncTheme();
  expect(theme.preference).toBe('dark');
  expect(theme.theme).toBe('dark');
  localStorage.clear();
  theme.syncTheme();
  expect(theme.preference).toBe('system');
  expect(theme.theme).toBe('light');
});

test('browsers without matchMedia use light mode and still permit a manual preference', () => {
  vi.stubGlobal('window', {});
  const theme = store();
  expect(theme.theme).toBe('light');
  theme.setTheme('dark');
  expect(theme.theme).toBe('dark');
});
