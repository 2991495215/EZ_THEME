// Production-package regression checks. Every request is local or mocked; no real login/payment writes.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const liveRoot = process.env.LIVE_THEME_DIR || '/opt/xboard/storage/theme/Xboard';
if (existsSync(liveRoot)) {
  const metadata = existsSync(path.join(liveRoot, 'release.json'))
    ? path.join(liveRoot, 'release.json') : new URL('../tests/live-theme-baseline.json', import.meta.url);
  const { files } = JSON.parse(readFileSync(metadata, 'utf8'));
  assert(files && Object.hasOwn(files, 'dashboard.blade.php'), 'live release metadata must include its template');
  for (const [relative, expected] of Object.entries(files)) {
    const file = path.resolve(liveRoot, relative);
    assert(file.startsWith(path.resolve(liveRoot) + path.sep), 'invalid live metadata path');
    assert(existsSync(file), 'live file missing: ' + relative);
    const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
    assert.equal(actual, expected, '线上文件已变化，先核对并合回源码：' + relative);
  }
  console.log('PASS: live theme integrity (' + Object.keys(files).length + ' files)');
} else {
  assert(!process.env.LIVE_THEME_DIR, 'configured live theme directory does not exist');
  console.log('Live theme not mounted here; browser/package checks still required. Verify live integrity on the deployment host.');
}
if (process.argv[2] === '--live-only') process.exit(0);
const output = path.resolve(process.argv[2] || 'dist');
const html = readFileSync(path.join(output, 'dashboard.blade.php'), 'utf8')
  .replace(/@json\(\$title\)/g, JSON.stringify('ZINC regression'))
  .replace(/\{\{\$title\}\}/g, 'ZINC regression');
let chromium;
try { ({ chromium } = require('playwright-core')); }
catch { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || '/usr/lib/node_modules/openclaw/node_modules/playwright-core')); }
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/root/.cache/puppeteer/chrome/linux-154.0.8037.57/chrome-linux64/chrome',
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const origin = 'https://theme.test/';
const now = Math.floor(Date.now() / 1000);
const plan = { id: 1, name: 'Test plan', transfer_enable: 100, capacity_limit: null, content: '',
  month_price: 1000, quarter_price: 2500, half_year_price: null, year_price: null,
  two_year_price: null, three_year_price: null, onetime_price: null };
const nodes = ['US 美国S12', 'US 美国S16', 'HK 香港S1'].map((name, index) => ({
  id: index + 1, name, type: 'vless', rate: 1, is_online: index === 1 ? 0 : 1, tags: [], machine_id: index + 1
}));
const machine = { machine: { id: 1, name: 'Test server', is_active: true, last_seen_at: now,
  load_status: { cpu: 20, mem: { used: 1, total: 4 }, disk: { used: 1, total: 8 } } },
  history: [now - 60, now].map(recorded_at => ({ recorded_at, cpu: 20, mem_used: 1, mem_total: 4,
    disk_used: 1, disk_total: 8, net_in_speed: 100, net_out_speed: 50 })) };
const context = await browser.newContext({ locale: 'zh-CN', colorScheme: 'light', viewport: { width: 1440, height: 900 } });
const requests = [], errors = [], unexpected = [];
let chartAttempts = 0, failCharts = false, planVersion = 1, docVersion = 0, releaseEnglish, releaseCharts;
let sawChartRetry;
const chartRetryRequested = new Promise(resolve => { sawChartRetry = resolve; });
try {
  await context.addInitScript(() => {
    localStorage.setItem('language', 'zh-CN');
    window.testNow = Date.now();
    Date.now = () => window.testNow;
  });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    requests.push(url.href);
    if (url.pathname.startsWith('/api/v1/')) {
      const endpoint = url.pathname.slice('/api/v1'.length);
      let data;
      if (request.method() !== 'GET' && endpoint !== '/passport/auth/login') {
        unexpected.push(request.method() + ' ' + endpoint);
        return route.abort();
      }
      if (endpoint.endsWith('/plan/fetch')) data = [{ ...plan, name: 'Test plan ' + planVersion }];
      else if (endpoint.endsWith('/comm/config') || endpoint === '/g/conf') data = { currency: 'CNY', currency_symbol: '¥', is_email_verify: false };
      else if (endpoint.endsWith('/server/fetch')) data = nodes;
      else if (endpoint.endsWith('/server/machine')) data = machine;
      else if (endpoint.endsWith('/knowledge/fetch')) {
        if (url.searchParams.get('language') === 'en-US') {
          await new Promise(resolve => { releaseEnglish = resolve; });
          data = { Test: [{ id: 1, title: 'Stale English', updated_at: now }] };
        } else data = { Test: [{ id: 1, title: ++docVersion === 1 ? '中文初始文档' : '中文最新文档', updated_at: now }] };
      }
      else if (endpoint === '/passport/auth/login') data = { token: 'regression-only', auth_data: 'regression-only' };
      else if (endpoint === '/user/info') data = { email: 'test@example.test', balance: 0, transfer_enable: 1000000000, u: 0, d: 0 };
      else if (endpoint === '/user/getSubscribe') data = { plan, subscribe_url: 'https://theme.test/mock' };
      else if (endpoint === '/user/order/detail') data = { trade_no: 'mock', status: 0, total_amount: 1000, period: 'month_price', plan, created_at: now };
      else if (endpoint === '/user/order/getPaymentMethod') data = [{ id: 1, name: 'Waffo test', icon: 'https://theme.test/theme/Xboard/images/logo.webp' }];
      else data = [];
      return route.fulfill({ json: { data } });
    }
    if (url.origin === 'https://card.net.coffee' && url.pathname === '/v1/card.svg') {
      return route.fulfill({ body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="200"/>', contentType: 'image/svg+xml' });
    }
    if (url.origin !== origin.slice(0, -1)) { unexpected.push(url.href); return route.abort(); }
    if (url.pathname === '/') return route.fulfill({ body: html, contentType: 'text/html' });
    if (!url.pathname.startsWith('/theme/Xboard/')) { unexpected.push(url.href); return route.abort(); }
    const relative = decodeURIComponent(url.pathname.slice('/theme/Xboard/'.length));
    const file = path.resolve(output, relative);
    assert(file.startsWith(output + path.sep), 'asset must remain inside release');
    if (failCharts && /(?:charts|nodeCharts)-.*\.js$/.test(file)) {
      chartAttempts++;
      if (chartAttempts === 1) return route.fulfill({ status: 503, contentType: 'text/javascript', body: '' });
      assert(url.searchParams.has('retry'), 'retry must change failed module URL');
      if (chartAttempts === 2) await new Promise(resolve => { releaseCharts = resolve; sawChartRetry(); });
    }
    assert(existsSync(file), 'missing release asset: ' + relative);
    const contentType = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
      '.webp': 'image/webp', '.png': 'image/png', '.html': 'text/html' }[path.extname(file)] || 'application/octet-stream';
    return route.fulfill({ body: readFileSync(file), contentType });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  const navigate = async route => { await page.evaluate(route => { location.hash = '#' + route; }, route); };
  await page.goto(origin + '#/login');
  await page.locator('.auth-form').waitFor();
  await page.waitForFunction(() => !document.getElementById('appBootState'));
  assert((await page.title()).endsWith('ZINC regression'));
  assert.equal(new Set(requests.filter(url => /(?:zh-CN|en-US|vi-VN|zh-TW|ja-JP|ko-KR|ru-RU|fa-IR)-/.test(url))).size, 2);
  assert(!requests.some(url => /txz\.png|fonts\.googleapis/.test(url)));
  await page.locator('.legal-link').first().click();
  await page.locator('.legal-dialog[open]').waitFor();
  await page.locator('.legal-dialog-close').click();
  await navigate('/shop');
  await page.locator('.plan-card').waitFor();
  await page.locator('.period-tag').nth(1).click();
  const selectedPeriod = await page.locator('.period-tag.active').innerText();
  await page.evaluate(() => { window.testLayout = document.querySelector('.main-board'); });
  await navigate('/nodes');
  await page.locator('.node-item').first().waitFor();
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForFunction(() => [...document.querySelectorAll('.node-flag')].every(img => img.complete && img.naturalWidth > 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow: ' + width);
  }
  const cards = await page.locator('.node-item').allTextContents();
  assert.match(cards[0], /CN2/); assert.match(cards[0], /CMIN2/); assert(!cards[0].includes('9929'));
  assert.match(cards[1], /CN2/); assert.match(cards[1], /9929/); assert.match(cards[1], /CMIN2/);
  assert(!/CN2|9929|CMIN2/.test(cards[2]));
  assert(await page.locator('.status-indicator.online').first().evaluate(el => getComputedStyle(el).animationName.startsWith('pulse')));
  assert(await page.locator('.node-status.offline .status-indicator').evaluate(el => getComputedStyle(el).animationName.startsWith('pulse')));
  assert(!requests.some(url => /(?:charts|nodeCharts)-.*\.js/.test(url)), 'closed details must not download charts');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await navigate('/shop');
  await page.locator('.plan-card').waitFor();
  assert.equal(await page.locator('.period-tag.active').innerText(), selectedPeriod);
  assert.equal(requests.filter(url => url.includes('/guest/plan/fetch')).length, 1);
  await navigate('/nodes');
  await page.locator('.node-item').first().waitFor();
  assert.equal(requests.filter(url => url.includes('/guest/server/fetch')).length, 1);
  planVersion = 2;
  await page.evaluate(() => { window.testNow += 31000; });
  await navigate('/shop');
  await page.getByText('Test plan 2', { exact: true }).waitFor();
  assert.equal(await page.locator('.period-tag.active').innerText(), selectedPeriod);
  assert.equal(requests.filter(url => url.includes('/guest/comm/config')).length, 1);
  assert(await page.evaluate(() => document.querySelector('.main-board') === window.testLayout && !document.body.classList.contains('page-transitioning')));
  await navigate('/docs');
  await page.getByText('中文初始文档', { exact: true }).waitFor();
  await page.locator('.language-btn').click();
  await page.getByText('English', { exact: true }).last().click();
  await page.waitForFunction(() => document.querySelector('.docs-inner')?.getAttribute('aria-busy') === 'true');
  assert(await page.getByText('中文初始文档', { exact: true }).isVisible());
  await page.locator('.language-btn').click();
  await page.getByText('简体中文', { exact: true }).last().click();
  await page.getByText('中文最新文档', { exact: true }).waitFor();
  releaseEnglish();
  assert.equal(await page.locator('.docs-inner').getAttribute('aria-busy'), 'false');
  assert.equal(await page.getByText('Stale English', { exact: true }).count(), 0);
  await navigate('/login');
  await page.locator('input[type=email]').fill('test@example.test');
  await page.locator('input[type=password]').fill('mock-password');
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/#/dashboard');
  await navigate('/payment?trade_no=mock');
  await page.locator('.method-icon img').waitFor();
  for (const [width, expected] of [[1440, 270], [375, 180]]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.locator('.method-icon').evaluate(el => el.getBoundingClientRect().width), expected);
  }
  failCharts = true;
  await navigate('/nodes');
  await page.locator('.more-btn').first().click();
  const retry = page.locator('.node-detail-modal-overlay [role=alert] button');
  await retry.waitFor();
  await retry.click();
  await Promise.race([chartRetryRequested, new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error('chart retry did not reach network')), 12000);
    timer.unref();
  })]);
  await page.locator('.node-detail-modal-overlay [role=status]').waitFor();
  await page.locator('.modal-close-btn').click();
  releaseCharts();
  await page.locator('.more-btn').first().click();
  await page.locator('.probe-chart-canvas canvas').first().waitFor();
  assert.equal(chartAttempts, 2);
  assert.equal(await page.locator('.node-detail-modal-overlay [role=alert]').count(), 0);
  await page.locator('.modal-close-btn').click();
  await page.locator('.more-btn').first().click();
  await page.locator('.probe-chart-canvas canvas').first().waitFor();
  assert.equal(chartAttempts, 2);
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, []);
  console.log('PASS: production package, mock login, legal, locales, cache/refresh, docs race, flags/tags/layout, motion, payment icons, chart failure/retry');
} finally {
  releaseEnglish?.();
  releaseCharts?.();
  await context.close();
  await browser.close();
}
