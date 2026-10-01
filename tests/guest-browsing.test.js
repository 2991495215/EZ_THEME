import { expect, test, vi } from 'vitest';
import request from '../src/api/request';
import { getUserInfo, getSubscribe, getNotices, getUserStats, getUserConfig } from '../src/api/dashboard';
import { fetchPlans, fetchPlanById, getCommConfig } from '../src/api/shop';
import { fetchKnowledgeList, fetchKnowledgeDetail } from '../src/api/docs';
import { fetchServerNodes, fetchNodeMachine } from '../src/api/servers';

vi.mock('../src/api/request', () => ({
  default: vi.fn(async () => ({ data: [] }))
}));

test('guest browsing uses public APIs and never requests account or machine data', async () => {
  localStorage.clear();
  request.mockClear();
  const privateReads = [getUserInfo, getSubscribe, getNotices, getUserStats, () => fetchNodeMachine(1)];
  for (const read of privateReads) expect(await read()).toEqual({ data: null });
  expect(request).not.toHaveBeenCalled();

  const publicReads = [getUserConfig, getCommConfig, fetchPlans, () => fetchPlanById(7),
    () => fetchKnowledgeList('zh-CN'), () => fetchKnowledgeDetail(3, 'zh-CN'), fetchServerNodes];
  for (const read of publicReads) await read();
  const guestURLs = request.mock.calls.map(([config]) => config.url);
  expect(guestURLs).toEqual([
    '/guest/comm/config', '/guest/comm/config', '/guest/plan/fetch', '/guest/plan/fetch?id=7',
    '/guest/knowledge/fetch?language=zh-CN', '/guest/knowledge/fetch?id=3&language=zh-CN', '/guest/server/fetch'
  ]);

  localStorage.setItem('token', 'test-token');
  request.mockClear();
  for (const read of publicReads) await read();
  expect(request.mock.calls.map(([config]) => config.url))
    .toEqual(guestURLs.map(url => url.replace('/guest/', '/user/')));
  request.mockClear();
  for (const read of privateReads) await read();
  expect(request.mock.calls.map(([config]) => config.url)).toEqual([
    '/user/info', '/user/getSubscribe', '/user/notice/fetch', '/user/getStat', '/user/server/machine'
  ]);
  localStorage.clear();
});
