import { expect, test } from 'vitest';
import { localizeText } from '../src/utils/localizedContent';

const samples = [
  'Standard 标准', 'Plus 增强', 'Pro 专业', 'Lite 轻量',
  '📦 每月 1000 GB 流量', '📱 支持 10 台设备同时在线', '📱 同时在线设备数量不限',
  '🎬 流媒体解锁与 AI 访问', '🔒 Hysteria2 / AnyTLS 加密传输', '🔒 Hysteria2 加密传输',
  '🚀 方案不设限速，实际速度取决于线路与网络', '⭐ 包含三网优化线路',
  '服务器购买建议', '防失联', '可访问的域名：',
  '🇺🇸 美国S01｜1倍', '🇯🇵 日本动态家宽S7｜2倍', 'KR 韩国动态家宽S10｜2倍',
  '🇳🇱 荷兰S18｜0倍｜💩', '🇺🇸 美国S12｜AT'
];

test('known operator content translates without mutating Chinese or unknown copy', () => {
  for (const value of samples) {
    expect(localizeText(value, 'zh-CN')).toBe(value);
    const english = localizeText(value, 'en-US');
    expect(english).not.toMatch(/[\u3400-\u9fff]/u);
    expect(localizeText(english, 'en-US')).toBe(english);
  }
  expect(localizeText('📦 每月 1000 GB 流量', 'en-US')).toBe('📦 1000 GB monthly data');
  expect(localizeText('📱 支持 10 台设备同时在线', 'en-US')).toBe('📱 Up to 10 simultaneous devices');
  expect(localizeText('🇯🇵 日本动态家宽S7｜2倍', 'en-US')).toBe('🇯🇵 Japan Dynamic Residential S7｜2x');
  expect(localizeText('Unknown 自定义内容', 'en-US')).toBe('Unknown 自定义内容');
  expect(localizeText(null, 'en-US')).toBeNull();
  expect(localizeText(0, 'en-US')).toBe(0);
});
