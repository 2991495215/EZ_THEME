// Recovered from the live frontend-performance.js; private/payment data never enter this cache.
const entries = new Map();
export const guestCacheTTL = {
  '/guest/comm/config': 60000,
  '/guest/plan/fetch': 30000,
  '/guest/server/fetch': 15000
};

export function applyGuestCache(config, path, authenticated) {
  const ttl = guestCacheTTL[path];
  if (!ttl || config.method !== 'get' || authenticated || config.headers.Authorization ||
      config.signal || config.cancelToken) return;
  const adapter = config.adapter;
  config.adapter = async request => {
    const params = { ...request.params };
    if (path === '/guest/server/fetch') delete params._t;
    const key = JSON.stringify([request.baseURL, request.url, request._authSession,
      localStorage.getItem('language'), params, request.headers]);
    let entry = entries.get(key);
    if (!entry || entry.expires <= Date.now()) {
      entry = { expires: Infinity };
      const remove = () => { if (entries.get(key) === entry) entries.delete(key); };
      entry.promise = Promise.resolve().then(() => adapter(request)).then(response => {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        if (response.status !== 200 || !data || !Object.hasOwn(data, 'data')) remove();
        else entry.expires = Date.now() + ttl;
        return response;
      }).catch(error => { remove(); throw error; });
      entries.set(key, entry);
      if (entries.size > 32) entries.delete(entries.keys().next().value);
    }
    const response = await entry.promise;
    return { ...response, config: request, data: structuredClone(response.data) };
  };
}
