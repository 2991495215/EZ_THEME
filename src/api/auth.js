
import request from './request';
import store from '@/store';
import { SITE_CONFIG } from '@/utils/baseConfig';
import { reloadMessages } from '@/i18n';
import { getAuthSession } from '@/api/client/authToken';


const setCookie = (name, value, days) => {
  const siteName = SITE_CONFIG.siteName;
  
  const cookieValue = JSON.stringify({
    site: siteName,
    value: value
  });
  
  const isSecure = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  const domain = isLocalhost ? '' : `domain=${window.location.hostname};`;
  let cookieString = `${name}=${encodeURIComponent(cookieValue)}; ${expires}; ${domain} path=/`;
  
  if (isSecure) {
    cookieString += '; secure';
  }
  
  cookieString += '; SameSite=Lax';
  
  document.cookie = cookieString;
  
  try {
    localStorage.setItem(`cookie_${name}`, cookieValue);
  } catch (err) {
  }
  
  const cookieSession = getAuthSession();
  setTimeout(() => {
    if (cookieSession !== getAuthSession()) return;
    const checkCookie = getCookie(name);
    const success = !!checkCookie;
    
    if (!success) {
      document.cookie = `${name}=${encodeURIComponent(cookieValue)}; ${expires}; path=/`;
      localStorage.setItem(`cookie_${name}_failure`, 'true');
      window.authCookieFailure = true;
    }
  }, 300);
};


export const getCookie = (name) => {
  const siteName = SITE_CONFIG.siteName;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  let cookieValue = null;
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        const rawValue = c.substring(nameEQ.length, c.length);
        const decodedValue = decodeURIComponent(rawValue);
        const parsedValue = JSON.parse(decodedValue);
        
        if (parsedValue && parsedValue.site === siteName) {
          cookieValue = parsedValue.value;
          break;
        }
      } catch (err) {
        console.error('Cookie 解析失败:', err);
      }
    }
  }
  
  if (!cookieValue) {
    try {
      const localValue = localStorage.getItem(`cookie_${name}`);
      if (localValue) {
        try {
          const parsedValue = JSON.parse(localValue);
          if (parsedValue && parsedValue.site === siteName) {
            cookieValue = parsedValue.value;
          }
        } catch (err) {
          console.error('LocalStorage cookie 解析失败:', err);
        }
      }
    } catch (err) {
    }
  }
  
  if (!cookieValue && name === 'auth_data' && window.authDataInStorage) {
    cookieValue = window.authDataInStorage;
  }
  
  return cookieValue;
};


export const handleLoginSuccess = (responseData, rememberMe) => {
  try {
    _clearAllAuthData();
    window._isLoggingOut = false;
    window.isUserLoggedIn = undefined;
    window.authCookieFailure = false;
    window.authDataInStorage = null;
    
    store.dispatch('login', responseData.token || responseData.auth_data);
    
    localStorage.setItem('token', responseData.token || responseData.auth_data);
    if (responseData.is_admin === 1) {
      localStorage.setItem('is_admin', '1');
    }
    
    if (responseData.auth_data) {
      localStorage.setItem('auth_data', responseData.auth_data);
    }
    
    const days = rememberMe ? 30 : 1; 
    if (responseData.auth_data) {
      setCookie('auth_data', responseData.auth_data, days);
    }
    
    const loginSession = getAuthSession();
    setTimeout(() => {
      if (loginSession !== getAuthSession()) return;
      const loginCheck = checkLoginStatus();
      
      if (!loginCheck) {
        window.isUserLoggedIn = true;
        
        if (responseData.auth_data) {
          window.authDataInStorage = responseData.auth_data;
          localStorage.setItem('cookie_auth_data', responseData.auth_data);
        }
      }
      
      reloadMessages().catch(() => {
      });
    }, 500);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


const normalizeAuthResponse = (response) => {
  let responseData = response;

  if ((response && response.data) || (response && typeof response === 'object' && Object.prototype.hasOwnProperty.call(response, 'data'))) {
    responseData = response.data;
  }

  if (responseData?.data && typeof responseData.data === 'object') {
    responseData = responseData.data;
  }

  if (responseData?.authData && !responseData.auth_data) {
    responseData.auth_data = responseData.authData;
  }

  if (responseData?.token && !responseData.auth_data) {
    responseData.auth_data = responseData.token;
  }

  if (responseData?.auth_data && !responseData.token) responseData.token = responseData.auth_data;
  return responseData;
};

export const login = async (loginData) => {
  const { rememberMe, ...requestData } = loginData;
  
  const response = await request({
    url: '/passport/auth/login',
    method: 'post',
    data: requestData
  });
  
  const responseData = normalizeAuthResponse(response);
  
  if (!responseData || !(responseData.token || responseData.auth_data)) {
    throw new Error(responseData?.message || '登录数据不完整');
  }
  
  const handledResponse = handleLoginSuccess(responseData, rememberMe);
  
  if (handledResponse.success) {
    return {
      success: true,
      token: responseData.token,
      auth_data: responseData.auth_data,
      is_admin: responseData.is_admin
    };
  } else {
    throw new Error(handledResponse.error);
  }
};


export function register(data) {
  return request({
    url: '/passport/auth/register',
    method: 'post',
    data
  }).then(response => {
    const responseData = normalizeAuthResponse(response);
    if (responseData?.token || responseData?.auth_data) {
      const handled = handleLoginSuccess(responseData, false);
      if (!handled.success) throw new Error(handled.error);
    }

    return response;
  });
}


export function resetPassword(data) {
  return request({
    url: '/passport/auth/forget',
    method: 'post',
    data
  });
}


export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  });
}


export const logout = async () => {
  try {
    _clearAllAuthData();
    
    return new Promise(resolve => {
      setTimeout(() => {
        reloadMessages().then(() => {
          resolve({
            success: true,
            redirectToLogin: true,
            redirectUrl: '/login?logout=true'
          });
        }).catch(() => {
            resolve({
              success: true,
              redirectToLogin: true,
              redirectUrl: '/login?logout=true'
            });
        });
      }, 200);
    });
  } catch (error) {
    return {
      success: false,
      error: error.message,
      redirectToLogin: true,
      redirectUrl: '/login?logout=true'
    };
  }
};


export function getWebsiteConfig() {
  return request({
    url: '/guest/comm/config',
    method: 'get'
  });
}


export function sendEmailVerify(data) {
  const sendData = { ...data };
  
  if (window.EZ_CONFIG && window.EZ_CONFIG.PANEL_TYPE === 'Xiao-V2board' && 
      typeof sendData.isForgetPassword !== 'undefined') {
    sendData.isforget = sendData.isForgetPassword ? 1 : 0;
    delete sendData.isForgetPassword;
  }
  
  return request({
    url: '/passport/comm/sendEmailVerify',
    method: 'post',
    data: sendData
  });
}


export const checkLoginStatus = () => {
  if (window._isLoggingOut === true) {
    _cacheLoginStatus(false);
    return false;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('logout') === 'true') {
    _clearAllAuthData();
    _cacheLoginStatus(false);
    return false;
  }
  
  if (window.isUserLoggedIn === false) {
    _cacheLoginStatus(false);
    return false;
  }
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null' || token === '') {
    _clearAllAuthData(); 
    _cacheLoginStatus(false);
    return false;
  }
  
  const authData = localStorage.getItem('auth_data') || 
                  sessionStorage.getItem('auth_data') || 
                  window.authDataInStorage;
                  
  if (!authData || authData === 'undefined' || authData === 'null' || authData === '') {
    if (window.isUserLoggedIn === true) {
      _cacheLoginStatus(true);
      return true;
    }
    
    _clearAllAuthData();
    _cacheLoginStatus(false);
    return false;
  }
  
  try {
    const vuexAuth = store.getters.isLoggedIn;
    if (!vuexAuth) {
    }
  } catch (e) {
  }
  
  const userInfoStr = localStorage.getItem('userInfo');
  let userInfo = null;
  
  try {
    if (userInfoStr) {
      userInfo = JSON.parse(userInfoStr);
      if (!userInfo || typeof userInfo !== 'object') {
        userInfo = null;
      }
    }
  } catch (e) {
    userInfo = null;
    localStorage.removeItem('userInfo');
  }
  
  const isLoggedIn = !!token && !!authData;
  
  if (isLoggedIn) {
    window.isUserLoggedIn = true;
  }
  
  _cacheLoginStatus(isLoggedIn);
  return isLoggedIn;
};


const _cacheLoginStatus = (status) => {
  window._lastLoginCheck = status;
  window._lastLoginCheckTime = Date.now();
};


const _clearAllAuthData = () => store.commit('CLEAR_USER');
export const forceLogout = _clearAllAuthData;

export const tokenLogin = (verifyToken, redirect) => {
  return request({
    url: `/passport/auth/token2Login`,
    method: 'get',
    params: { 
      verify: verifyToken,
      redirect: redirect || '' 
    }
  });
};


export const checkUserLoginStatus = async () => {
  const authData = localStorage.getItem('auth_data') || sessionStorage.getItem('auth_data');
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token || !authData) {
    forceLogout(); 
    return { isLoggedIn: false };
  }
  
  try {
    const response = await request({
      url: '/user/checkLogin',
      method: 'GET',
      headers: {
        'Authorization': authData
      }
    });
    
    if (response && response.data && response.data.is_login === true) {
      window.isUserLoggedIn = true;
      return { isLoggedIn: true };
    } else {
      console.log('登录已过期或失效，清除登录状态');
      forceLogout();
      
      const currentRoute = window.location.pathname;
      const isAuthPage = /\/(login|register|forgot-password)/.test(currentRoute);
      
      if (!isAuthPage) {
        window.location.href = '/#/login';
      }
      
      return { isLoggedIn: false, message: '登录已过期，请重新登录' };
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
    
    if (error.response && error.response.data && error.response.data.message === '未登录或登陆已过期') {
      forceLogout();
      
      const currentRoute = window.location.pathname;
      const isAuthPage = /\/(login|register|forgot-password)/.test(currentRoute);
      
      if (!isAuthPage) {
        window.location.href = '/#/login';
      }
      
      return { isLoggedIn: false, message: '登录已过期，请重新登录' };
    }
    
    return { isLoggedIn: null, error: error.message || '网络错误' };
  }
}; 
