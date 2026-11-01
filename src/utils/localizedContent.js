// shortcut: only known operator copy is translated; add entries when backend copy changes.
const englishText = {
  'Standard 标准': 'Standard',
  'Plus 增强': 'Plus',
  'Pro 专业': 'Pro',
  'Lite 轻量': 'Lite',
  '服务器购买建议': 'VPS buying guide',
  '防失联': 'Stay connected',
  '可访问的域名：': 'Available domains:',
  '流媒体解锁与 AI 访问': 'Streaming unblocking and AI access',
  'Hysteria2 / AnyTLS 加密传输': 'Encrypted transport with Hysteria2 / AnyTLS',
  'Hysteria2 加密传输': 'Encrypted transport with Hysteria2',
  '方案不设限速，实际速度取决于线路与网络': 'No plan speed cap; actual speeds depend on the route and network',
  '方案不限速，实际速度取决于线路与网络': 'No plan speed cap; actual speeds depend on the route and network',
  '包含三网优化线路': 'Includes routes optimized for China Telecom, China Unicom and China Mobile',
  '同时在线设备数量不限': 'Unlimited simultaneous devices',
  '节点页面可以前往探针查看服务器状态。': 'Open the server monitor from the Nodes page to view server status.',
  '如果你需要购买 VPS，可以参考探针页面中的服务器和厂商信息，结合地区、线路、价格、配置和稳定性自行判断。': 'If you need a VPS, review the servers and providers listed on the monitor and compare their locations, routes, prices, specifications and stability.',
  '标记说明：': 'Marker guide:',
  '⭐ 表示我推荐的 VPS 厂商或方案。': '⭐ marks VPS providers or plans I recommend.',
  '💩 表示建议别买的 VPS 厂商或方案。': '💩 marks VPS providers or plans I suggest avoiding.',
  '探针数据和推荐仅供参考，购买前请自行核实当前价格、库存、线路和服务条款。': 'Monitor data and recommendations are for reference. Verify current prices, availability, routes and terms of service before purchasing.'
};
const countries = { '美国': 'United States', '香港': 'Hong Kong', '日本': 'Japan', '韩国': 'South Korea', '荷兰': 'Netherlands', '台湾': 'Taiwan', '英国': 'United Kingdom', '新加坡': 'Singapore', '德国': 'Germany' };

export function localizeText(value, locale) {
  if (typeof value !== 'string' || !locale?.startsWith('en')) return value;
  return value.split('\n').map(line => {
    const text = line.trim();
    if (Object.hasOwn(englishText, text)) return line.replace(text, englishText[text]);
    const feature = line.match(/^(\s*(?:📦|📱|🎬|🔒|🚀|⭐)\s*)(.*)$/u);
    if (feature && Object.hasOwn(englishText, feature[2])) return feature[1] + englishText[feature[2]];
    return line
      .replace(/每月\s*([\d.]+)\s*GB\s*流量/g, '$1 GB monthly data')
      .replace(/支持\s*(\d+)\s*台设备同时在线/g, 'Up to $1 simultaneous devices')
      .replace(/^(\s*(?:[\u{1F1E6}-\u{1F1FF}]{2}\s*|[A-Za-z]{2}\s+)?)(美国|香港|日本|韩国|荷兰|台湾|英国|新加坡|德国)(动态家宽)?(?=[SN]\d)/u,
        (_, prefix, country, residential) => prefix + countries[country] + (residential ? ' Dynamic Residential ' : ' '))
      .replace(/([｜|]\s*)(\d+(?:\.\d+)?)倍(?=$|[｜|\s])/g, '$1$2x');
  }).join('\n');
}

export function localizeHtml(html, locale) {
  if (typeof html !== 'string' || !locale?.startsWith('en')) return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement?.closest('script, style, code, pre')) {
      walker.currentNode.textContent = localizeText(walker.currentNode.textContent, locale);
    }
  }
  return template.innerHTML;
}
