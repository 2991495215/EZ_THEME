<template>
  <transition name="fade">
    <div v-if="show" class="node-detail-modal-overlay" @click.self="close">
      <div class="node-detail-modal-container">
        <div class="node-detail-modal-header">
          <div class="modal-title-group">
            <span class="modal-title-icon">
              <IconServer :size="20" />
            </span>
            <div class="modal-title-copy">
              <h3 class="modal-title">{{ node.name || '节点状态' }}</h3>
              <p class="modal-subtitle">服务器状态</p>
            </div>
          </div>

          <div class="modal-header-actions">
            <a
              class="modal-probe-link"
              href="https://k.zinc.run/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="前往探针"
            >
              <IconExternalLink :size="16" />
              前往探针
            </a>

            <button class="modal-close-btn" @click="close" aria-label="关闭">
              <IconX :size="20" />
            </button>
          </div>
        </div>

        <div class="node-detail-modal-body">
          <div v-if="machineLoading" class="probe-inline-state">
            正在同步服务器状态...
          </div>

          <div v-else-if="machineError" class="probe-inline-state is-error">
            {{ machineError }}
          </div>

          <template v-if="machine">
            <section class="probe-summary">
              <div class="probe-server-head">
                <div class="probe-server-name">
                  <IconServer2 :size="18" />
                  <span>{{ machine.name || '未命名服务器' }}</span>
                </div>
                <span class="probe-status-badge" :class="statusClass">
                  {{ statusText }}
                </span>
              </div>

              <div class="probe-meta-grid">
                <div class="probe-meta-item">
                  <span>节点类型</span>
                  <strong>{{ node.type || '-' }}</strong>
                </div>
                <div class="probe-meta-item">
                  <span>倍率</span>
                  <strong>{{ rateText }}</strong>
                </div>
                <div class="probe-meta-item">
                  <span>最后心跳</span>
                  <strong>{{ heartbeatText }}</strong>
                </div>
              </div>
            </section>

            <div class="probe-dashboard-grid">
              <section class="probe-panel probe-trend-panel">
                <div class="probe-panel-head">
                  <div>
                    <IconChartLine :size="18" />
                    <h4>资源趋势</h4>
                  </div>
                  <span>{{ historyRangeText }}</span>
                </div>

                <div v-if="hasHistory" class="probe-chart-grid">
                  <article class="probe-chart-card">
                    <div class="probe-chart-title">
                      <span><IconCpu :size="15" />CPU 占用</span>
                      <strong>{{ percentText(cpuUsage) }}</strong>
                    </div>
                    <div :ref="element => setChartRef('cpu', element)" class="probe-chart-canvas"></div>
                  </article>

                  <article class="probe-chart-card">
                    <div class="probe-chart-title">
                      <span><IconDeviceDesktop :size="15" />内存占用</span>
                      <strong>{{ percentText(memoryUsage) }}</strong>
                    </div>
                    <div :ref="element => setChartRef('memory', element)" class="probe-chart-canvas"></div>
                  </article>

                  <article class="probe-chart-card">
                    <div class="probe-chart-title">
                      <span><IconDatabase :size="15" />磁盘占用</span>
                      <strong>{{ percentText(diskUsage) }}</strong>
                    </div>
                    <div :ref="element => setChartRef('disk', element)" class="probe-chart-canvas"></div>
                  </article>

                  <article class="probe-chart-card">
                    <div class="probe-chart-title">
                      <span><IconActivity :size="15" />实时网速</span>
                      <strong>{{ speedText(netInSpeed) }} / {{ speedText(netOutSpeed) }}</strong>
                    </div>
                    <div :ref="element => setChartRef('network', element)" class="probe-chart-canvas"></div>
                  </article>
                </div>
                <div v-else class="probe-trend-empty">暂无趋势数据</div>
              </section>

              <div class="probe-side-stack">
                <section class="probe-panel probe-metrics">
                  <div class="probe-panel-head">
                    <div>
                      <IconActivity :size="18" />
                      <h4>负载</h4>
                    </div>
                  </div>

                  <div class="probe-metric-row">
                    <div class="probe-metric-head">
                      <span><IconCpu :size="16" />CPU</span>
                      <strong>{{ percentText(cpuUsage) }}</strong>
                    </div>
                    <div class="probe-meter">
                      <span :style="{ width: meterWidth(cpuUsage) }"></span>
                    </div>
                  </div>

                  <div class="probe-metric-row">
                    <div class="probe-metric-head">
                      <span><IconDeviceDesktop :size="16" />内存</span>
                      <strong>{{ bytePairText(memoryMetric) }}</strong>
                    </div>
                    <div class="probe-meter">
                      <span :style="{ width: meterWidth(memoryUsage) }"></span>
                    </div>
                  </div>

                  <div class="probe-metric-row">
                    <div class="probe-metric-head">
                      <span><IconDatabase :size="16" />磁盘</span>
                      <strong>{{ bytePairText(diskMetric) }}</strong>
                    </div>
                    <div class="probe-meter">
                      <span :style="{ width: meterWidth(diskUsage) }"></span>
                    </div>
                  </div>

                  <div class="probe-speed-row">
                    <div>
                      <span><IconArrowDown :size="15" />下行</span>
                      <strong>{{ speedText(netInSpeed) }}</strong>
                    </div>
                    <div>
                      <span><IconArrowUp :size="15" />上行</span>
                      <strong>{{ speedText(netOutSpeed) }}</strong>
                    </div>
                  </div>
                </section>

                <section class="probe-panel probe-related">
                  <div class="probe-panel-head">
                    <div>
                      <IconAffiliate :size="18" />
                      <h4>关联节点</h4>
                    </div>
                    <span>{{ normalizedRelatedNodes.length }} 个</span>
                  </div>

                  <div v-if="normalizedRelatedNodes.length > 0" class="probe-related-list">
                    <div
                      v-for="item in normalizedRelatedNodes"
                      :key="item.id"
                      class="probe-related-node"
                      :class="{ current: isCurrentNode(item) }"
                    >
                      <div class="probe-related-main">
                        <span class="probe-related-dot" :class="{ online: isNodeOnline(item) }"></span>
                        <strong>{{ item.name || '未命名节点' }}</strong>
                      </div>
                      <div class="probe-related-meta">
                        <span>{{ item.type || '-' }}</span>
                        <span>{{ nodeRateText(item) }}</span>
                        <span v-if="nodeOnlineText(item)">{{ nodeOnlineText(item) }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-else class="probe-related-empty">暂无关联节点</div>
                </section>
              </div>
            </div>

          </template>

          <section v-else class="probe-empty">
            <IconAlertCircle :size="36" />
            <h4>未绑定服务器</h4>
            <p>后台服务器管理绑定后，这里会显示当前节点所处服务器名称和状态。</p>
          </section>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, watch } from 'vue';
import {
  IconActivity,
  IconAlertCircle,
  IconAffiliate,
  IconArrowDown,
  IconArrowUp,
  IconChartLine,
  IconCpu,
  IconDatabase,
  IconDeviceDesktop,
  IconExternalLink,
  IconServer,
  IconServer2,
  IconX
} from '@tabler/icons-vue';
import { use, init } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  node: {
    type: Object,
    default: () => ({})
  },
  machineDetail: {
    type: Object,
    default: null
  },
  machineLoading: {
    type: Boolean,
    default: false
  },
  machineError: {
    type: String,
    default: ''
  },
  relatedNodes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close']);
const chartElements = new Map();
const chartInstances = new Map();
let chartFrame = null;

const setChartRef = (key, element) => {
  if (element) {
    chartElements.set(key, element);
    return;
  }

  chartElements.delete(key);
  const instance = chartInstances.get(key);

  if (instance) {
    instance.dispose();
    chartInstances.delete(key);
  }
};

const close = () => {
  emit('close');
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeLoadStatus = (status) => {
  if (!status) {
    return {};
  }

  if (typeof status === 'string') {
    try {
      return JSON.parse(status) || {};
    } catch (error) {
      return {};
    }
  }

  return status;
};

const machine = computed(() => {
  if (props.machineDetail && Object.prototype.hasOwnProperty.call(props.machineDetail, 'machine')) {
    return props.machineDetail.machine;
  }

  return props.node?.machine || null;
});
const loadStatus = computed(() => normalizeLoadStatus(machine.value?.load_status));
const historyRows = computed(() => {
  const rows = props.machineDetail?.history;

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map(row => ({
      recordedAt: toNumber(row.recorded_at),
      cpu: toNumber(row.cpu) ?? 0,
      memory: ratio({
        used: toNumber(row.mem_used) ?? 0,
        total: toNumber(row.mem_total) ?? 0
      }),
      disk: ratio({
        used: toNumber(row.disk_used) ?? 0,
        total: toNumber(row.disk_total) ?? 0
      }),
      netIn: toNumber(row.net_in_speed) ?? 0,
      netOut: toNumber(row.net_out_speed) ?? 0
    }))
    .filter(row => row.recordedAt)
    .sort((a, b) => a.recordedAt - b.recordedAt);
});
const hasHistory = computed(() => historyRows.value.length > 1);

const lastSeenAt = computed(() => toNumber(machine.value?.last_seen_at));
const isMachineActive = computed(() => machine.value?.is_active === true || machine.value?.is_active === 1);

const isOnline = computed(() => {
  if (!isMachineActive.value || !lastSeenAt.value) {
    return false;
  }

  return Math.floor(Date.now() / 1000) - lastSeenAt.value <= 300;
});

const statusText = computed(() => {
  if (!isMachineActive.value) {
    return '已停用';
  }

  return isOnline.value ? '在线' : '离线';
});

const statusClass = computed(() => ({
  online: isOnline.value,
  offline: !isOnline.value
}));

const heartbeatText = computed(() => {
  if (!lastSeenAt.value) {
    return '-';
  }

  const diff = Math.max(0, Math.floor(Date.now() / 1000) - lastSeenAt.value);

  if (diff < 60) {
    return `${diff || 1}秒前`;
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟前`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时前`;
  }

  return `${Math.floor(diff / 86400)}天前`;
});

const rateText = computed(() => {
  if (props.node?.rate === undefined || props.node?.rate === null || props.node?.rate === '') {
    return '-';
  }

  return `x${props.node.rate}`;
});

const cpuUsage = computed(() => toNumber(loadStatus.value?.cpu) ?? 0);

const memoryMetric = computed(() => ({
  used: toNumber(loadStatus.value?.mem?.used) ?? 0,
  total: toNumber(loadStatus.value?.mem?.total) ?? 0
}));

const diskMetric = computed(() => ({
  used: toNumber(loadStatus.value?.disk?.used) ?? 0,
  total: toNumber(loadStatus.value?.disk?.total) ?? 0
}));

const memoryUsage = computed(() => ratio(memoryMetric.value));
const diskUsage = computed(() => ratio(diskMetric.value));
const netInSpeed = computed(() => toNumber(loadStatus.value?.net?.in_speed) ?? 0);
const netOutSpeed = computed(() => toNumber(loadStatus.value?.net?.out_speed) ?? 0);
const normalizedRelatedNodes = computed(() => {
  const nodes = Array.isArray(props.relatedNodes) ? props.relatedNodes : [];
  const fallback = props.node ? [props.node] : [];
  const source = nodes.length > 0 ? nodes : fallback;
  const seen = new Set();

  return source.filter((item) => {
    if (!item?.id || seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
});

const historyRangeText = computed(() => {
  if (!hasHistory.value) {
    return '24h';
  }

  const first = historyRows.value[0]?.recordedAt;
  const last = historyRows.value[historyRows.value.length - 1]?.recordedAt;

  if (!first || !last || last <= first) {
    return '24h';
  }

  const hours = Math.max(1, Math.round((last - first) / 3600));
  return `${hours}h`;
});

const chartColors = {
  cpu: '#111827',
  memory: '#8b5cf6',
  disk: '#14b8a6',
  netIn: '#10b981',
  netOut: '#3b82f6'
};

function ratio(metric) {
  if (!metric.total) {
    return 0;
  }

  return (metric.used / metric.total) * 100;
}

function percentText(value) {
  return `${Math.max(0, value).toFixed(value >= 10 ? 0 : 1)}%`;
}

function meterWidth(value) {
  const width = Math.max(0, Math.min(100, value));
  return `${width}%`;
}

function formatBytes(value) {
  const number = Math.max(0, Number(value) || 0);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = number;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const decimals = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(decimals)} ${units[unitIndex]}`;
}

function bytePairText(metric) {
  if (!metric.total) {
    return '-';
  }

  return `${formatBytes(metric.used)} / ${formatBytes(metric.total)}`;
}

function speedText(value) {
  return `${formatBytes(value)}/s`;
}

function chartTimeText(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value * 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function chartPercent(value) {
  return Math.max(0, value).toFixed(value >= 10 ? 0 : 1);
}

function formatSpeedAxis(value) {
  if (!value) {
    return '0';
  }

  return formatBytes(value).replace(' ', '');
}

function isCurrentNode(item) {
  return Number(item?.id) === Number(props.node?.id);
}

function isNodeOnline(item) {
  return item?.is_online === true || item?.is_online === 1;
}

function nodeRateText(item) {
  if (item?.rate === undefined || item?.rate === null || item?.rate === '') {
    return 'x-';
  }

  return `x${item.rate}`;
}

function nodeOnlineText(item) {
  const value = toNumber(item?.online);

  if (value === null) {
    return '';
  }

  return `${Math.floor(Math.max(0, value))} 在线`;
}

function disposeCharts() {
  if (chartFrame) {
    cancelAnimationFrame(chartFrame);
    chartFrame = null;
  }

  chartInstances.forEach(instance => instance.dispose());
  chartInstances.clear();
}

function scheduleCharts() {
  if (!hasHistory.value) {
    disposeCharts();
    return;
  }

  if (chartFrame) {
    cancelAnimationFrame(chartFrame);
  }

  chartFrame = requestAnimationFrame(() => {
    chartFrame = null;
    renderCharts();
  });
}

function renderCharts() {
  if (!hasHistory.value || chartElements.size === 0) {
    return;
  }

  const firstElement = chartElements.values().next().value;
  const overlay = firstElement?.closest('.node-detail-modal-overlay');
  const overlayStyle = overlay ? getComputedStyle(overlay) : null;
  const rootStyle = getComputedStyle(document.documentElement);
  const readCssVar = (style, name, fallback) => {
    return style?.getPropertyValue(name).trim()
      || rootStyle.getPropertyValue(name).trim()
      || fallback;
  };
  const textColor = readCssVar(overlayStyle, '--node-modal-text', '#111827');
  const mutedColor = readCssVar(overlayStyle, '--node-modal-muted', '#64748b');
  const borderColor = readCssVar(overlayStyle, '--node-modal-chart-grid', '#e2e8f0');
  const tooltipBackground = overlayStyle?.getPropertyValue('--node-modal-surface').trim() || '#ffffff';
  const times = historyRows.value.map(row => chartTimeText(row.recordedAt));

  const xAxis = {
    type: 'category',
    boundaryGap: false,
    data: times,
    axisTick: { show: false },
    axisLabel: {
      color: mutedColor,
      fontSize: 10,
      hideOverlap: true
    },
    axisLine: {
      lineStyle: { color: borderColor }
    }
  };
  const tooltip = (formatter) => ({
    trigger: 'axis',
    confine: true,
    backgroundColor: tooltipBackground,
    borderColor,
    textStyle: {
      color: textColor,
      fontSize: 11
    },
    formatter
  });
  const percentageOption = (name, color, values) => ({
    animation: false,
    color: [color],
    tooltip: tooltip(params => {
      const item = params[0];
      return `${item?.axisValue || ''}<br/>${item?.marker || ''} ${name}: ${chartPercent(item?.data || 0)}%`;
    }),
    grid: {
      top: 10,
      left: 40,
      right: 12,
      bottom: 24
    },
    xAxis,
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: mutedColor,
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: borderColor,
          type: 'dashed'
        }
      }
    },
    series: [{
      name,
      type: 'line',
      smooth: 0.25,
      showSymbol: false,
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.06 },
      data: values
    }]
  });
  const chartOptions = {
    cpu: percentageOption('CPU', chartColors.cpu, historyRows.value.map(row => row.cpu)),
    memory: percentageOption('内存', chartColors.memory, historyRows.value.map(row => row.memory)),
    disk: percentageOption('磁盘', chartColors.disk, historyRows.value.map(row => row.disk)),
    network: {
      animation: false,
      color: [chartColors.netIn, chartColors.netOut],
      tooltip: tooltip(params => {
        const rows = [`${params[0]?.axisValue || ''}`];
        params.forEach(item => rows.push(`${item.marker} ${item.seriesName}: ${speedText(item.data)}`));
        return rows.join('<br/>');
      }),
      legend: {
        top: 0,
        right: 4,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: {
          color: mutedColor,
          fontSize: 10
        },
        data: ['下行', '上行']
      },
      grid: {
        top: 30,
        left: 48,
        right: 12,
        bottom: 24
      },
      xAxis,
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: {
          formatter: value => formatSpeedAxis(value),
          color: mutedColor,
          fontSize: 10
        },
        splitLine: {
          lineStyle: {
            color: borderColor,
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: '下行',
          type: 'line',
          smooth: 0.25,
          showSymbol: false,
          lineStyle: { width: 2 },
          data: historyRows.value.map(row => row.netIn)
        },
        {
          name: '上行',
          type: 'line',
          smooth: 0.25,
          showSymbol: false,
          lineStyle: { width: 2 },
          data: historyRows.value.map(row => row.netOut)
        }
      ]
    }
  };

  chartElements.forEach((element, key) => {
    const { width, height } = element.getBoundingClientRect();

    if (width <= 0 || height <= 0 || !chartOptions[key]) {
      return;
    }

    let instance = chartInstances.get(key);

    if (!instance) {
      instance = init(element);
      chartInstances.set(key, instance);
    }

    instance.setOption(chartOptions[key], true);
  });
}

function handleResize() {
  chartInstances.forEach(instance => instance.resize());
}

watch(
  () => [props.show, props.machineDetail],
  () => {
    if (!props.show) {
      disposeCharts();
      return;
    }

    nextTick(scheduleCharts);
  },
  { deep: true, immediate: true }
);

watch(hasHistory, () => {
  if (props.show) {
    nextTick(scheduleCharts);
  }
});

window.addEventListener('resize', handleResize);

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  disposeCharts();
});
</script>

<style scoped lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.node-detail-modal-overlay {
  --node-modal-surface: #ffffff;
  --node-modal-header-surface: #ffffff;
  --node-modal-soft-surface: #f4f7fb;
  --node-modal-hover-surface: #eaf0f8;
  --node-modal-border: rgba(var(--theme-color-rgb), 0.2);
  --node-modal-chart-grid: rgba(100, 116, 139, 0.2);
  --node-modal-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 10px 26px rgba(31, 28, 22, 0.08);
  --node-modal-overlay: rgba(0, 0, 0, 0.5);
  --node-modal-text: #111827;
  --node-modal-muted: #64748b;
  --text-color: var(--node-modal-text);
  --text-muted: var(--node-modal-muted);

  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--node-modal-overlay);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 86px 20px 20px;
  box-sizing: border-box;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

:global(body.dark-theme .node-detail-modal-overlay) {
  --node-modal-surface: #1f2937;
  --node-modal-header-surface: #1f2937;
  --node-modal-soft-surface: #263244;
  --node-modal-hover-surface: #2c394c;
  --node-modal-border: rgba(var(--theme-color-rgb), 0.24);
  --node-modal-chart-grid: rgba(148, 163, 184, 0.22);
  --node-modal-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 30px rgba(0, 0, 0, 0.16);
  --node-modal-overlay: rgba(0, 0, 0, 0.55);
  --node-modal-text: rgba(255, 255, 255, 0.92);
  --node-modal-muted: rgba(226, 232, 240, 0.72);
}

.node-detail-modal-container {
  width: 100%;
  max-width: 980px;
  background: var(--node-modal-surface);
  color: var(--text-color);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-radius: 16px;
  box-shadow: var(--node-modal-shadow);
  border: 1px solid var(--node-modal-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: min(88vh, 760px);
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.node-detail-modal-header {
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--node-modal-border);
  background: var(--node-modal-header-surface);
  flex-shrink: 0;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.modal-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--theme-color);
  background-color: rgba(var(--theme-color-rgb), 0.1);
  border: 1px solid rgba(var(--theme-color-rgb), 0.18);
  border-radius: 9px;
  flex: 0 0 auto;
}

.modal-title-copy {
  min-width: 0;
}

.modal-title {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 650;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-subtitle {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
  flex: 0 0 auto;
}

.modal-probe-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 36px;
  padding: 0 14px 0 12px;
  border: 1px solid rgba(var(--theme-color-rgb), 0.22);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0.28)),
    rgba(var(--theme-color-rgb), 0.08);
  color: rgb(var(--theme-color-rgb));
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  box-shadow:
    0 8px 18px rgba(31, 28, 22, 0.055),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;

  svg {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
    padding: 3px;
    margin-left: -2px;
    border-radius: 6px;
    background-color: rgba(var(--theme-color-rgb), 0.12);
    box-sizing: content-box;
  }

  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.34);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.34)),
      rgba(var(--theme-color-rgb), 0.12);
    box-shadow:
      0 10px 22px rgba(var(--theme-color-rgb), 0.11),
      inset 0 1px 0 rgba(255, 255, 255, 0.64);
    transform: translateY(-1px);
  }
}

:global(body.dark-theme .modal-probe-link) {
  border-color: rgba(var(--theme-color-rgb), 0.26);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02)),
    rgba(var(--theme-color-rgb), 0.16);
  color: rgba(232, 240, 255, 0.94);
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

:global(body.dark-theme .modal-probe-link:hover) {
  border-color: rgba(var(--theme-color-rgb), 0.38);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.03)),
    rgba(var(--theme-color-rgb), 0.2);
  box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, rgba(226, 232, 240, 0.72));
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 9px;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex: 0 0 auto;

  &:hover {
    background-color: var(--node-modal-hover-surface);
    color: var(--text-color);
  }
}

.node-detail-modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex-grow: 1;
  -webkit-overflow-scrolling: touch;
}

.probe-summary,
.probe-panel,
.probe-empty {
  border: 1px solid var(--node-modal-border);
  border-radius: 12px;
  background-color: var(--node-modal-soft-surface);
}

.probe-summary {
  padding: 16px;
}

.probe-inline-state {
  padding: 10px 12px;
  border: 1px solid rgba(var(--theme-color-rgb), 0.18);
  border-radius: 9px;
  background-color: rgba(var(--theme-color-rgb), 0.08);
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.35;
}

.probe-inline-state.is-error {
  border-color: rgba(var(--theme-color-rgb), 0.22);
  background-color: rgba(var(--theme-color-rgb), 0.08);
  color: var(--theme-color);
}

:global(body.dark-theme .probe-inline-state.is-error) {
  border-color: rgba(var(--theme-color-rgb), 0.28);
  background-color: rgba(var(--theme-color-rgb), 0.12);
  color: var(--theme-color);
}

.probe-server-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.probe-server-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--text-color);
  font-size: 17px;
  font-weight: 700;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.probe-status-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;

  &.online {
    color: #16843a;
    border: 1px solid rgba(22, 132, 58, 0.22);
    background-color: rgba(22, 132, 58, 0.11);
  }

  &.offline {
    color: var(--text-muted);
    border: 1px solid var(--node-modal-border);
    background-color: var(--node-modal-soft-surface);
  }
}

:global(body.dark-theme .probe-status-badge.online) {
  color: #86efac;
  border-color: rgba(134, 239, 172, 0.24);
  background-color: rgba(34, 197, 94, 0.12);
}

:global(body.dark-theme .probe-status-badge.offline) {
  color: var(--text-muted);
  border-color: var(--node-modal-border);
  background-color: var(--node-modal-soft-surface);
}

.probe-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.probe-meta-item {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--node-modal-border);
  border-radius: 9px;
  background-color: var(--node-modal-surface);

  span {
    display: block;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.3;
  }

  strong {
    display: block;
    margin-top: 7px;
    color: var(--text-color);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.probe-dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.8fr);
  gap: 18px;
  align-items: stretch;
}

.probe-side-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.probe-panel {
  padding: 16px;
  min-width: 0;
}

.probe-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  > div {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: var(--text-color);
  }

  svg {
    flex: 0 0 auto;
    color: var(--text-muted);
  }

  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 750;
    line-height: 1.25;
    color: var(--text-color);
  }

  > span {
    flex: 0 0 auto;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1;
  }
}

.probe-trend-panel {
  display: flex;
  flex-direction: column;
  min-height: 480px;
}

.probe-chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  flex: 1 1 auto;
}

.probe-chart-card {
  display: flex;
  min-width: 0;
  min-height: 190px;
  padding: 12px;
  flex-direction: column;
  border: 1px solid var(--node-modal-border);
  border-radius: 10px;
  background-color: var(--node-modal-surface);
}

.probe-chart-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 24px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 650;
  }

  svg {
    color: var(--theme-color);
  }

  strong {
    color: var(--text-color);
    font-size: 12px;
    font-weight: 750;
    line-height: 1.25;
    text-align: right;
  }
}

.probe-chart-canvas {
  width: 100%;
  min-height: 150px;
  flex: 1 1 auto;
}

.probe-trend-empty,
.probe-related-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border: 1px dashed var(--node-modal-border);
  border-radius: 9px;
  color: var(--text-muted);
  font-size: 13px;
}

.probe-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.probe-metric-row {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.probe-metric-head,
.probe-speed-row > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-color);
}

.probe-metric-head span,
.probe-speed-row span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1;
}

.probe-metric-head strong,
.probe-speed-row strong {
  color: var(--text-color);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  text-align: right;
}

.probe-meter {
  height: 8px;
  border-radius: 999px;
  background-color: rgba(148, 163, 184, 0.24);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    min-width: 2px;
    border-radius: inherit;
    background-color: var(--theme-color);
  }
}

.probe-speed-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding-top: 2px;

  > div {
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--node-modal-border);
    border-radius: 9px;
    background-color: var(--node-modal-surface);
  }
}

.probe-related {
  flex: 1 1 auto;
}

.probe-related-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 210px;
  overflow-y: auto;
  padding-right: 2px;
}

.probe-related-node {
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid var(--node-modal-border);
  border-radius: 9px;
  background-color: var(--node-modal-surface);

  &.current {
    border-color: rgba(var(--theme-color-rgb), 0.32);
    background-color: rgba(var(--theme-color-rgb), 0.08);
  }
}

.probe-related-main,
.probe-related-meta {
  display: flex;
  align-items: center;
  min-width: 0;
}

.probe-related-main {
  gap: 8px;

  strong {
    min-width: 0;
    color: var(--text-color);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.probe-related-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background-color: rgba(148, 163, 184, 0.7);
  flex: 0 0 auto;

  &.online {
    background-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.14);
  }
}

.probe-related-meta {
  gap: 8px;
  margin-top: 8px;
  padding-left: 16px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.2;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    + span::before {
      content: "";
      display: inline-block;
      width: 3px;
      height: 3px;
      margin: 0 8px 2px 0;
      border-radius: 999px;
      background-color: currentColor;
      opacity: 0.45;
    }
  }
}

.probe-empty {
  padding: 28px 20px;
  text-align: center;
  color: var(--text-muted);

  svg {
    color: var(--theme-color);
    margin-bottom: 12px;
  }

  h4 {
    margin: 0;
    color: var(--text-color);
    font-size: 17px;
    font-weight: 700;
  }

  p {
    margin: 10px auto 0;
    max-width: 340px;
    font-size: 14px;
    line-height: 1.6;
  }
}

@media (max-width: 820px) {
  .node-detail-modal-overlay {
    align-items: center;
    padding: 20px;
  }

  .node-detail-modal-container {
    max-width: 620px;
  }

  .probe-dashboard-grid {
    grid-template-columns: 1fr;
  }

  .probe-trend-panel {
    min-height: 460px;
  }

  .probe-chart-card {
    min-height: 180px;
  }
}

@media (max-width: 480px) {
  .node-detail-modal-overlay {
    padding: 10px;
    align-items: center;
  }

  .node-detail-modal-container {
    margin: 0;
    max-height: calc(92vh - 40px);
  }

  .node-detail-modal-header,
  .node-detail-modal-body {
    padding: 16px;
  }

  .modal-probe-link {
    width: 36px;
    padding: 0;

    svg {
      margin: 0;
    }
  }

  .modal-probe-link {
    font-size: 0;
  }

  .probe-meta-grid,
  .probe-speed-row {
    grid-template-columns: 1fr;
  }

  .probe-trend-panel {
    min-height: 760px;
  }

  .probe-chart-grid {
    grid-template-columns: 1fr;
  }

  .probe-chart-card {
    min-height: 170px;
  }

  .probe-chart-canvas {
    min-height: 132px;
  }

  .probe-server-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .probe-status-badge {
    align-self: flex-start;
  }
}
</style>
