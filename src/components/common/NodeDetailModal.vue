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
              <p class="modal-subtitle">服务器探针</p>
            </div>
          </div>

          <button class="modal-close-btn" @click="close" aria-label="关闭">
            <IconX :size="20" />
          </button>
        </div>

        <div class="node-detail-modal-body">
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

            <section class="probe-metrics">
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

            <div class="probe-actions">
              <a
                class="page-nav-btn"
                href="https://k.trent30.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconExternalLink :size="16" />
                前往探针
              </a>
            </div>
          </template>

          <section v-else class="probe-empty">
            <IconAlertCircle :size="36" />
            <h4>未绑定探针服务器</h4>
            <p>后台服务器管理绑定后，这里会显示当前节点所处服务器名称和状态。</p>
          </section>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';
import {
  IconAlertCircle,
  IconArrowDown,
  IconArrowUp,
  IconCpu,
  IconDatabase,
  IconDeviceDesktop,
  IconExternalLink,
  IconServer,
  IconServer2,
  IconX
} from '@tabler/icons-vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  node: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close']);

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

const machine = computed(() => props.node?.machine || null);
const loadStatus = computed(() => normalizeLoadStatus(machine.value?.load_status));

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
  --node-modal-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 10px 26px rgba(31, 28, 22, 0.08);
  --node-modal-overlay: rgba(0, 0, 0, 0.5);

  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--node-modal-overlay);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
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
  --node-modal-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 30px rgba(0, 0, 0, 0.16);
  --node-modal-overlay: rgba(0, 0, 0, 0.55);
}

.node-detail-modal-container {
  width: 100%;
  max-width: 560px;
  background: var(--node-modal-surface);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-radius: 16px;
  box-shadow: var(--node-modal-shadow);
  border: 1px solid var(--node-modal-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: min(85vh, 620px);
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

.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  margin-left: 12px;
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
.probe-metrics,
.probe-empty {
  border: 1px solid var(--node-modal-border);
  border-radius: 12px;
  background-color: var(--node-modal-soft-surface);
}

.probe-summary {
  padding: 16px;
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
    color: #c2410c;
    border: 1px solid rgba(194, 65, 12, 0.24);
    background-color: rgba(194, 65, 12, 0.1);
  }
}

:global(body.dark-theme) .probe-status-badge.online {
  color: #86efac;
  border-color: rgba(134, 239, 172, 0.24);
  background-color: rgba(34, 197, 94, 0.12);
}

:global(body.dark-theme) .probe-status-badge.offline {
  color: #fdba74;
  border-color: rgba(253, 186, 116, 0.24);
  background-color: rgba(249, 115, 22, 0.12);
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

.probe-metrics {
  padding: 16px;
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

.probe-actions {
  display: flex;
  justify-content: center;
  padding-top: 2px;
}

.page-nav-btn {
  min-height: 40px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  background-color: rgba(var(--theme-color-rgb), 0.1);
  color: var(--theme-color);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  border: 1px solid rgba(var(--theme-color-rgb), 0.2);
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.16);
    border-color: rgba(var(--theme-color-rgb), 0.3);
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

@media (max-width: 480px) {
  .node-detail-modal-overlay {
    padding: 10px;
    align-items: center;
  }

  .node-detail-modal-container {
    margin: 0;
    max-height: calc(90vh - 80px);
  }

  .node-detail-modal-header,
  .node-detail-modal-body {
    padding: 16px;
  }

  .probe-meta-grid,
  .probe-speed-row {
    grid-template-columns: 1fr;
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
