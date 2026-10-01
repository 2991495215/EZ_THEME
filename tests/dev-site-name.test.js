import { afterEach, expect, test, vi } from 'vitest';
import { createRuntimeConfigPlugin } from '../vite.config';

const plugin = createRuntimeConfigPlugin({ enableConfigJS: false });
const html = '<head><!--EZ_CONFIG_SCRIPT--></head><body></body>';
afterEach(() => vi.unstubAllGlobals());

test('development refreshes read the backend title and safely inject it before app startup', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  for (const title of ['XBoard', '新名称 &amp; </script>']) {
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '<title>' + title + '</title>' });
    const result = await plugin.transformIndexHtml(html, { server: {} });
    expect(result).toContain('window.XBOARD_APP_NAME = new DOMParser()');
    expect(result).toContain(JSON.stringify('<title>' + title + '</title>').replace(/</g, '\\u003c'));
    expect(result).not.toContain('<!--EZ_CONFIG_SCRIPT-->');
  }
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:7001');
});

test('production retains backend template injection without fetching the local server', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  expect(await plugin.transformIndexHtml(html)).toBe('<head></head><body></body>');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('backend errors and missing titles fail visibly instead of displaying a hardcoded name', async () => {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, text: async () => '<html></html>' }));
  await expect(plugin.transformIndexHtml(html, { server: {} })).rejects.toThrow('HTTP 503');
  await expect(plugin.transformIndexHtml(html, { server: {} })).rejects.toThrow('缺少站点名称');
});
