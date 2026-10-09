import { expect, test } from 'vitest';
import { formatNodeName, formatNodeTags } from '../src/utils/formatters';
const flags = import.meta.glob('../src/assets/i18N/*.svg', { eager: true, query: '?url', import: 'default' });

test('node names use local flag images without changing labels or unknown prefixes', () => {
  for (const [code, label] of [['US', '美国S1'], ['HK', '香港N1'], ['JP', '日本S13'],
    ['NL', '荷兰S18'], ['KR', '韩国动态家宽｜S7'], ['TW', '台湾动态家宽｜N5']]) {
    const emoji = [...code].map(char => String.fromCodePoint(char.charCodeAt(0) - 65 + 0x1F1E6)).join('');
    for (const prefix of [emoji, code, code.toLowerCase()]) {
      const result = formatNodeName(`${prefix} ${label}`);
      expect(result.flag).toBeTruthy();
      expect(result.flag).toBe(flags[`../src/assets/i18N/${code}.svg`]);
      expect(result.label).toBe(label);
    }
  }
  for (const name of ['美国S1', '🇦🇶 南极', 'UServer', '<script>alert(1)</script>', '']) {
    expect(formatNodeName(name)).toEqual({ flag: undefined, label: name });
  }
  expect(formatNodeName('🇺🇸 美国S12｜AT').label).toBe('美国S12｜AT');
});

test('historical route tags cover both protocols, preserve existing tags and skip ordinary routes', () => {
  for (const suffix of ['', '｜AT']) {
    expect(formatNodeTags({ name: `🇺🇸 美国S12${suffix}`, tags: null })).toEqual(['CN2', 'CMIN2']);
    expect(formatNodeTags({ name: `🇺🇸 美国S16${suffix}`, tags: [] })).toEqual(['CN2', '9929', 'CMIN2']);
  }
  const node = { name: 'US 美国S16', tags: ['已有标签', 'CN2'] };
  expect(formatNodeTags(node)).toEqual(['已有标签', 'CN2', '9929', 'CMIN2']);
  expect(node.tags).toEqual(['已有标签', 'CN2']);
  for (const name of ['🇺🇸 美国S1', '🇯🇵 日本S13', '🇺🇸 美国S120', '🇺🇸 美国S160', '🇯🇵 日本动态家宽｜S16']) {
    expect(formatNodeTags({ name, tags: null })).toEqual([]);
  }
});
