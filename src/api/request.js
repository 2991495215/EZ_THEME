
import axios from 'axios';
import { API_BASE_URL, getApiBaseUrl, isXiaoV2board, isXboard, CUSTOM_HEADERS_CONFIG } from '@/utils/baseConfig';
import { mapApiPath } from './utils/pathMapper';
import { getAvailableApiUrl } from '@/utils/apiAvailabilityChecker';
import { getEncrypUrl, randomIv } from "@/api/utils/encryption";
import { readAuthData, getAuthSession } from '@/api/client/authToken';
import { applyCustomHeaders } from '@/api/client/headers';
import { normalizeRequestError } from '@/api/client/errors';
import { applyGuestCache, guestCacheTTL } from '@/api/client/guestCache';
import { pinia, useAuthStore } from '@/stores';

const isEncrypted = window.EZ_CONFIG &&
  window.EZ_CONFIG.API_MIDDLEWARE_ENABLED &&
  window.EZ_CONFIG.API_MIDDLEWARE_KEY &&
  window.EZ_CONFIG.API_MIDDLEWARE_KEY !== '';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    // 只有在加密模式下才添加 X-IV 头
    ...(isEncrypted && { 'X-IV': randomIv() }),
  }
});

const expireCurrentSession = (config) => {
  if (!config?._authData || config._authSession !== getAuthSession()) return;
  useAuthStore(pinia).clearUser();
  window.location.href = '/#/login';
};

const rejectStaleSession = (config) => {
  if (config?._authSession !== undefined && config._authSession !== getAuthSession()) {
    throw new axios.CanceledError('登录状态已改变，忽略旧请求');
  }
};

const publicAuthPaths = [
  '/passport/auth/login',
  '/passport/auth/register',
  '/passport/auth/forget',
  '/passport/auth/token2Login',
  '/passport/comm/sendEmailVerify',
  '/guest/comm/config',
  '/guest/plan/fetch',
  '/guest/knowledge/fetch',
  '/guest/server/fetch'
];

const shouldAttachAuth = (url) => {
  if (!url) return true;

  const rawUrl = String(url);
  return !publicAuthPaths.some(path => rawUrl === path || rawUrl.startsWith(`${path}?`));
};

request.interceptors.request.use(
  async config => {
      const originalUrl = config.url;
      config._authSession ??= getAuthSession();
      rejectStaleSession(config);
      config.baseURL = getApiBaseUrl();
    
    if (window.EZ_CONFIG && window.EZ_CONFIG.API_MIDDLEWARE_ENABLED) {
      
      const path = originalUrl.startsWith("http") ? mapApiPath(config.url) : `${window.EZ_CONFIG.API_MIDDLEWARE_PATH}/${btoa(getEncrypUrl(config.url))}`
      
      config.url = isEncrypted ? path : mapApiPath(config.url);
      
      if (import.meta.env.DEV) {
        console.log(`API路径映射: ${originalUrl} -> ${config.url}`);
      }
    }
    else if (window.EZ_CONFIG && window.EZ_CONFIG.API_BASE_URLS &&
             Array.isArray(window.EZ_CONFIG.API_BASE_URLS) &&
             window.EZ_CONFIG.API_BASE_URLS.length > 1) {
      const availableApiUrl = getAvailableApiUrl();
      if (availableApiUrl) {
        config.baseURL = availableApiUrl;
      }
    }
    
    if ((isXiaoV2board() || isXboard()) && config.method === 'post' && config.data) {
      const formData = new URLSearchParams();
      for (const key in config.data) {
        if (Object.prototype.hasOwnProperty.call(config.data, key)) {
          formData.append(key, config.data[key]);
        }
      }
      
      config.data = formData;
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    
    const authData = shouldAttachAuth(originalUrl) ? await readAuthData() : '';
    
    rejectStaleSession(config);
    config._authData = authData;
    if (authData) {
      config.headers['Authorization'] = authData;
    }
    
    try {
      applyCustomHeaders(config.headers, CUSTOM_HEADERS_CONFIG);
    } catch (error) {
      console.error('应用自定义标头失败:', error);
    }
    
    if (guestCacheTTL[originalUrl]) {
      const authenticated = localStorage.getItem('token') || await readAuthData();
      rejectStaleSession(config);
      applyGuestCache(config, originalUrl, authenticated);
    }
    return config;
  },
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(new Error('请求配置错误'));
  }
);

request.interceptors.response.use(
  response => {
    rejectStaleSession(response.config);
    const res = response.data;
    if (res?.message === '未登录或登陆已过期') {
      expireCurrentSession(response.config);
      return Promise.reject(new Error(res.message));
    }
    return res;
  },
  error => {
    rejectStaleSession(error.config);
    if (error.response?.status === 401) expireCurrentSession(error.config);
    return Promise.reject(normalizeRequestError(error));
  }
);

// Private configuration only merges concurrent reads; it never persists responses.
const pendingConfig = new Map();
const sendRequest = config => {
  const scopedConfig = { ...config, _authSession: getAuthSession() };
  if ((config.method || 'get').toLowerCase() !== 'get' ||
      config.url !== '/user/comm/config' ||
      config.signal || config.cancelToken) return request(scopedConfig);

  const key = JSON.stringify([getApiBaseUrl(), scopedConfig._authSession,
    localStorage.getItem('language'), config.url, config.params, config.headers]);
  if (pendingConfig.has(key)) return pendingConfig.get(key);
  const pending = request(scopedConfig).finally(() => pendingConfig.delete(key));
  pendingConfig.set(key, pending);
  return pending;
};

export default sendRequest;
