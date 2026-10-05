import { beforeEach, expect, test, vi } from 'vitest';
import axios from 'axios';

vi.mock('../src/utils/baseConfig', () => ({
  API_BASE_URL: 'https://api.test/api/v1', getApiBaseUrl: () => 'https://api.test/api/v1',
  isXiaoV2board: () => false, isXboard: () => true, CUSTOM_HEADERS_CONFIG: {},
  SITE_CONFIG: { siteName: 'test' }, THEME_CONFIG: { defaultTheme: 'light' }
}));
vi.mock('../src/utils/apiAvailabilityChecker', () => ({ getAvailableApiUrl: () => '' }));
vi.mock('../src/api/utils/encryption', () => ({ getEncrypUrl: url => url, randomIv: () => '' }));
vi.mock('../src/api/client/headers', () => ({ applyCustomHeaders: () => {} }));

let request, auth, tokenUtils;
beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  vi.stubGlobal('window', { location: { hostname: 'test', href: '#/dashboard' } });
  vi.stubGlobal('document', { cookie: '', createElement: () => ({}) });
  vi.stubGlobal('sessionStorage', { removeItem: vi.fn(), getItem: () => null });
  request = (await import('../src/api/request')).default;
  const stores = await import('../src/stores');
  auth = stores.useAuthStore(stores.pinia);
  tokenUtils = await import('../src/api/client/authToken');
});
const login = (name = 'A') => {
  auth.setToken(name);
  localStorage.setItem('auth_data', name);
};
const response = (config, data) => ({ config, data, status: 200, headers: {} });
const unauthorized = config => Promise.reject(new axios.AxiosError('unauthorized', 'ERR_BAD_REQUEST', config,
  {}, { status: 401, data: { message: 'expired' }, config }));
const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

test('authenticated HTTP 401 clears Pinia, browser state and redirects', async () => {
  login();
  window._lastLoginCheck = true;
  await expect(request({ url: '/user/info', adapter: unauthorized })).rejects.toThrow();
  expect(auth.isLoggedIn).toBe(false);
  expect(localStorage.getItem('auth_data')).toBeNull();
  expect(window._lastLoginCheck).toBe(false);
  expect(window.location.href).toBe('/#/login');
});

test('login or guest HTTP 401 must not log out an existing account', async () => {
  login();
  for (const url of ['/passport/auth/login', '/guest/comm/config']) {
    await expect(request({ url, adapter: unauthorized })).rejects.toThrow();
    expect(auth.token).toBe('A');
    expect(window.location.href).toBe('#/dashboard');
  }
});

for (const fail of [false, true]) test('old account ' + (fail ? '401' : 'response') + ' cannot mutate the new session', async () => {
  login();
  let finish;
  const pending = request({ url: '/user/info', adapter: config => new Promise((resolve, reject) => {
    finish = () => fail ? unauthorized(config).catch(reject) : resolve(response(config, { data: 'account A' }));
  }) });
  const assertion = expect(pending).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  await nextTick();
  login('B');
  finish();
  await assertion;
  expect(auth.token).toBe('B');
  expect(window.location.href).toBe('#/dashboard');
});

test('logout invalidates pending reads even when the same token logs in again', async () => {
  login();
  let finish;
  const pending = request({ url: '/user/info', adapter: config => new Promise(resolve => {
    finish = () => resolve(response(config, { data: 'old' }));
  }) });
  const assertion = expect(pending).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  await nextTick();
  auth.clearUser();
  login();
  finish();
  await assertion;
});

test('identical config reads combine in-flight, but do not persist responses', async () => {
  let finish;
  const adapter = vi.fn(config => new Promise(resolve => { finish = () => resolve(response(config, { data: {} })); }));
  const config = { url: '/guest/comm/config', adapter };
  const a = request(config), b = request(config);
  expect(a).toBe(b);
  await nextTick();
  expect(adapter).toHaveBeenCalledTimes(1);
  finish();
  await a;
  const c = request({ ...config, adapter: cfg => Promise.resolve(response(cfg, { data: 2 })) });
  expect(c).not.toBe(a);
  expect(await c).toEqual({ data: 2 });
});

test('config rejection clears dedupe; language, account, and abort signals remain isolated', async () => {
  const config = { url: '/guest/comm/config', adapter: cfg => Promise.reject(new Error('offline')) };
  await expect(request(config)).rejects.toThrow('offline');
  const adapter = cfg => Promise.resolve(response(cfg, { data: true }));
  const a = request({ ...config, adapter });
  localStorage.setItem('language', 'en-US');
  const b = request({ ...config, adapter });
  expect(a).not.toBe(b);
  await Promise.all([a, b]);
  const c = request({ ...config, adapter, signal: new AbortController().signal });
  const d = request({ ...config, adapter, signal: new AbortController().signal });
  expect(c).not.toBe(d);
  await Promise.all([c, d]);
  login();
  const e = request({ ...config, url: '/user/comm/config', adapter });
  await e;
  expect(tokenUtils.getAuthSession()).toContain('A');
});
