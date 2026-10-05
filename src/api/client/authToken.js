import { SITE_CONFIG } from '@/utils/baseConfig';

const parseSiteScopedValue = (rawValue, siteName) => {
  if (!rawValue) return '';

  try {
    const parsedValue = JSON.parse(rawValue);
    if (parsedValue && parsedValue.site === siteName) {
      return parsedValue.value;
    }
  } catch (err) {
    return rawValue;
  }

  return '';
};

const readAuthCookieFallback = async () => {
  const cookieAuthData = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_data='));

  if (!cookieAuthData) return '';

  const encodedValue = cookieAuthData.split('=')[1];
  const decodedValue = decodeURIComponent(encodedValue);
  return parseSiteScopedValue(decodedValue, SITE_CONFIG.siteName) || encodedValue;
};

const readCookieValue = (name) => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i += 1) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') cookie = cookie.substring(1);

    if (cookie.indexOf(nameEQ) === 0) {
      const rawValue = cookie.substring(nameEQ.length);
      const decodedValue = decodeURIComponent(rawValue);
      return parseSiteScopedValue(decodedValue, SITE_CONFIG.siteName) || rawValue;
    }
  }

  return '';
};

export const readAuthData = async () => {
  let authData = localStorage.getItem('auth_data');

  if (!authData) {
    authData = readCookieValue('auth_data') || await readAuthCookieFallback();
  }

  if (!authData && window.authDataInStorage) {
    authData = window.authDataInStorage;
  }

  if (!authData) {
    const backupData = localStorage.getItem('cookie_auth_data');
    if (backupData) {
      authData = parseSiteScopedValue(backupData, SITE_CONFIG.siteName) || backupData;
    }
  }

  return authData || '';
};

// Requests started under an earlier login must not update or expire the new session.
let sessionRevision = 0;
export const getAuthSession = () => JSON.stringify([
  sessionRevision,
  localStorage.getItem('token'),
  localStorage.getItem('auth_data'),
  localStorage.getItem('cookie_auth_data'),
  window.authDataInStorage
]);
export const invalidateAuthSession = () => { sessionRevision += 1; };

export const clearBrowserAuthState = () => {
  invalidateAuthSession();
  window.isUserLoggedIn = false;
  window.authDataInStorage = null;
  window.authCookieFailure = false;
  window._lastLoginCheck = false;
  window._lastLoginCheckTime = 0;
  ['token', 'auth_data', 'cookie_auth_data', 'cookie_auth_data_failure',
    'userInfo', 'is_admin', 'vuex', 'user', 'auth'].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  ['auth_data', 'XSRF-TOKEN', 'laravel_session', 'token'].forEach(name => {
    ['/', '/dashboard', '/user', '/admin'].forEach(path => {
      const expired = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=' + path + ';';
      document.cookie = expired;
      document.cookie = expired + ' domain=' + window.location.hostname + ';';
    });
  });
};
