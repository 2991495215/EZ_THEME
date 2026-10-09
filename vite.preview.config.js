import baseConfig from './vite.config.js';

// Preview uses the real theme and public data, but cannot perform account actions.
export default context => {
  const config = baseConfig(context);
  config.plugins.unshift({
    name: 'read-only-theme-preview',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url, 'http://localhost').pathname;
        if (!pathname.startsWith('/api/')) return next();
        if (request.method === 'GET' && [
          '/api/v1/guest/comm/config',
          '/api/v1/guest/plan/fetch',
          '/api/v1/guest/knowledge/fetch',
          '/api/v1/guest/server/fetch',
          '/api/v1/g/conf'
        ].includes(pathname)) return next();
        response.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ message: '只读测试版本，不支持登录、下单或支付' }));
      });
    }
  });
  config.server.host = '127.0.0.1';
  config.server.strictPort = true;
  return config;
};
