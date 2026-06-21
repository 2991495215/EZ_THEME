<template>

  <div class="nodes-container">

    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->



    

    <div class="nodes-inner">

      <!-- 欢迎卡片 -->

      <div v-if="false" class="dashboard-card welcome-card">

        <div class="card-header">

          <h2 class="card-title">{{ $t('nodes.welcome.title') || '节点列表' }}</h2>

        </div>

        <div class="card-body">

          <p>{{ $t('nodes.welcome.description') || '查看并使用可用的服务器节点' }}</p>

        </div>

      </div>

      

      <!-- 节点列表状态 -->

      <div v-if="loading" class="nodes-loading">

        <LoadingSpinner />

        <p>{{ $t('nodes.loading') || '正在加载节点...' }}</p>

      </div>

      

      <!-- 错误提示 -->

      <div v-else-if="error" class="nodes-error">

        <IconAlertTriangle :size="48" class="error-icon" />

        <p>{{ error }}</p>

        <button class="retry-button" @click="fetchNodes">{{ $t('common.retry') || '重试' }}</button>

      </div>

      

      <!-- 节点列表内容 -->

      <div v-else-if="nodes.length > 0" class="nodes-content">

        <div class="node-summary-bar" aria-live="polite">
          <span v-if="hasOnlineCount" class="node-summary-tag">
            <IconUsers :size="16" />
            当前在线账号
            <span class="node-summary-count">{{ currentOnlineCount }}</span>
          </span>
          <a
            class="node-probe-link"
            href="https://k.trent30.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="打开探针"
          >
            <IconExternalLink :size="16" />
            前往探针
          </a>
        </div>

        <div class="node-items">

          <div v-for="node in nodes" :key="node.id" class="node-item">
            <div class="node-card-top">
              <div class="node-meta">
                <div class="node-status" :title="node.is_online === 1 ? 'Online' : 'Offline'">
                  <div class="status-indicator" :class="{ 'online': node.is_online === 1 }"></div>
                </div>

                <div class="node-tags">
                  <span class="node-tag rate-tag" v-if="showNodeRate">x{{ node.rate }}</span>
                  <span class="node-tag type-tag">{{ node.type }}</span>
                  <template v-if="node.tags && node.tags.length > 0">
                    <span v-for="(tag, index) in node.tags" :key="index" class="node-tag">
                      {{ tag }}
                    </span>
                  </template>
                </div>
              </div>

              <div v-if="showNodeRate && allowViewNodeInfo" class="node-actions">
                <button class="more-btn" @click="openNodeDetail(node)" aria-label="查看服务器状态">
                  <IconDotsVertical :size="18" />
                </button>
              </div>
            </div>

            <div class="node-info">
              <h3 class="node-name">{{ node.name }}</h3>
              <p class="node-host" v-if="showNodeDetails">{{ node.host }}:{{ node.port }}</p>
            </div>
          </div>

        </div>

      </div>

      

      <!-- 空状态 -->

      <div v-else class="nodes-empty">

        <IconServer :size="48" class="empty-icon" />

        <p>{{ $t('nodes.noNodes') || '暂无可用节点' }}</p>

      </div>

    </div>

    

    <!-- 节点详情模态框 -->

    <NodeDetailModal 

      v-if="allowViewNodeInfo"

      :show="showDetailModal" 

      :node="selectedNode" 

      :machine-detail="selectedMachineDetail"

      :machine-loading="machineDetailLoading"

      :machine-error="machineDetailError"

      :related-nodes="selectedRelatedNodes"

      @close="closeNodeDetail"

    />

  </div>

</template>



<script setup>

import { ref, computed, onMounted, inject } from 'vue';

import { useI18n } from 'vue-i18n';

import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

import { 

  IconAlertTriangle,

  IconServer,

  IconUsers,

  IconDotsVertical,

  IconExternalLink

} from '@tabler/icons-vue';

import { fetchNodeMachine, fetchServerNodes } from '@/api/servers';


import { NODES_CONFIG } from '@/utils/baseConfig';

import NodeDetailModal from '@/components/common/NodeDetailModal.vue';



const { t } = useI18n();

const $toast = inject('$toast');



const loading = ref(true);

const error = ref('');

const nodes = ref([]);

const showNodeDetails = ref(NODES_CONFIG.showNodeDetails); 
const showNodeRate = ref(NODES_CONFIG.showNodeRate);

const allowViewNodeInfo = ref(NODES_CONFIG.allowViewNodeInfo);


const backendOnlineTotal = ref(null);

const normalizeOnlineCount = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : null;
};

const getNodeOnlineCount = (node) => normalizeOnlineCount(node?.online);

const hasOnlineCount = computed(() => backendOnlineTotal.value !== null || nodes.value.some(node => getNodeOnlineCount(node) !== null));

const currentOnlineCount = computed(() => {
  if (backendOnlineTotal.value !== null) {
    return backendOnlineTotal.value;
  }

  return Math.max(
    ...nodes.value
      .map(node => getNodeOnlineCount(node))
      .filter(count => count !== null),
    0
  );
});







const showDetailModal = ref(false);

const selectedNode = ref(null);
const selectedMachineDetail = ref(null);
const machineDetailLoading = ref(false);
const machineDetailError = ref('');

const getMachineId = (node) => node?.machine_id ?? node?.machine?.id ?? null;

const selectedRelatedNodes = computed(() => {
  if (!selectedNode.value) {
    return [];
  }

  const machineId = getMachineId(selectedNode.value);

  if (!machineId) {
    return [selectedNode.value];
  }

  return nodes.value.filter(node => Number(getMachineId(node)) === Number(machineId));
});



const openNodeDetail = (node) => {

  selectedNode.value = node;
  selectedMachineDetail.value = null;
  machineDetailError.value = '';

  showDetailModal.value = true;
  fetchNodeMachineDetail(node);

};



const closeNodeDetail = () => {

  showDetailModal.value = false;

  setTimeout(() => {

    selectedNode.value = null;
    selectedMachineDetail.value = null;
    machineDetailError.value = '';

  }, 300);

};

const fetchNodeMachineDetail = async (node) => {
  if (!node?.id) {
    return;
  }

  machineDetailLoading.value = true;

  try {
    const result = await fetchNodeMachine(node.id);
    selectedMachineDetail.value = result?.data || null;
  } catch (err) {
    console.error('Failed to fetch node machine:', err);
    machineDetailError.value = err.response?.message || (err && err.message ? err.message : '服务器状态加载失败');
  } finally {
    machineDetailLoading.value = false;
  }
};


const fetchNodes = async () => {

  loading.value = true;

  error.value = '';



  try {

    const result = await fetchServerNodes();

    

    backendOnlineTotal.value = normalizeOnlineCount(result?.online_total);

    if (result && result.data) {

      nodes.value = result.data;

    } else {

      nodes.value = [];

    }

  } catch (err) {

    console.error('Failed to fetch nodes:', err);

    error.value = err.response?.message || (err && err.message ? err.message : t('common.networkError') || '网络错误');

    

    if ($toast) {

      $toast.error(error.value);

    }

  } finally {

    loading.value = false;

  }

};



onMounted(() => {


  
  fetchNodes();

});

</script>



<style lang="scss" scoped>

.nodes-container {

  position: relative;
  padding: 1.25rem;

  padding-bottom: calc(1.25rem + 64px); 

  

  @media (min-width: 768px) {

    padding: 2rem;

    padding-bottom: 3rem; 

  }

}



.nodes-inner {

  max-width: 1600px;

  margin: 0 auto;

}





.dashboard-card {

  background-color: var(--card-bg);

  border-radius: 12px;

  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  padding: 20px;

  margin-bottom: 24px;

  border: 1px solid var(--border-color);

  transition: all 0.3s ease;

  position: relative;

  

  &:hover {

    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

    border-color: rgba(var(--theme-color-rgb), 0.3);

  }

  

  .card-header {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 15px;

    

    .card-title {

      font-size: 18px;

      font-weight: 600;

      margin: 0;

    }

  }

  

  .card-body {

    p {

      color: var(--text-muted);

      margin: 0;

      line-height: 1.5;

    }

  }

}



.welcome-card {

  margin-bottom: 24px;

}





.nodes-content {

  display: flex;

  flex-direction: column;

  gap: 1.5rem;

  max-width: 1600px;

  width: 100%;

  margin: 0 auto;

  padding: 18px 20px 20px;

  border: 1px solid rgba(var(--text-color-rgb), 0.08);

  border-radius: 22px;

  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.08)),
    rgba(var(--card-background-rgb), 0.08);

  backdrop-filter: none;

  -webkit-backdrop-filter: none;

  box-sizing: border-box;

}



body.dark-theme .nodes-content {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025)),
    rgba(25, 25, 26, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}

.node-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  margin: 0 0 2px;
}

.node-summary-tag,
.node-probe-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 650;
  line-height: 1;
  white-space: nowrap;
}

.node-summary-tag {
  height: 40px;
  padding: 0 16px 0 14px;
  border: 1px solid rgba(var(--theme-color-rgb), 0.18);
  border-radius: 10px;
  background-color: rgba(var(--card-background-rgb), 0.46);
  color: var(--text-color);
  box-shadow: none;
}

.node-probe-link {
  margin-left: auto;
  height: 40px;
  padding: 0 16px 0 13px;
  border: 1px solid rgba(var(--theme-color-rgb), 0.2);
  border-radius: 10px;
  background-color: rgba(var(--card-background-rgb), 0.5);
  color: rgb(var(--theme-color-rgb));
  box-shadow: none;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.node-probe-link:hover {
  border-color: rgba(var(--theme-color-rgb), 0.34);
  background-color: rgba(var(--theme-color-rgb), 0.1);
  box-shadow: none;
  transform: translateY(-1px);
}

.node-summary-count {
  margin-left: 2px;
  color: var(--theme-color);
  font-size: 15px;
  font-weight: 850;
  line-height: 1;
}

.node-summary-tag svg,
.node-probe-link svg {
  flex: 0 0 auto;
}

.node-summary-tag svg {
  width: 17px;
  height: 17px;
  padding: 4px;
  margin-left: -2px;
  border-radius: 7px;
  background-color: rgba(var(--theme-color-rgb), 0.1);
  box-sizing: content-box;
}

.node-probe-link svg {
  width: 17px;
  height: 17px;
  padding: 4px;
  margin-left: -2px;
  border-radius: 7px;
  background-color: rgba(var(--theme-color-rgb), 0.12);
  box-sizing: content-box;
}

body.dark-theme .node-summary-tag {
  border-color: rgba(var(--theme-color-rgb), 0.26);
  background-color: rgba(31, 35, 41, 0.78);
  color: rgba(255, 255, 255, 0.82);
  box-shadow: none;
}

body.dark-theme .node-summary-count {
  color: var(--theme-color);
}

body.dark-theme .node-summary-tag svg {
  background-color: rgba(var(--theme-color-rgb), 0.16);
  color: var(--theme-color);
}

body.dark-theme .node-probe-link {
  border-color: rgba(255, 255, 255, 0.12);
  background-color: rgba(31, 35, 41, 0.82);
  color: rgba(255, 255, 255, 0.82);
  box-shadow: none;
}

body.dark-theme .node-probe-link:hover {
  border-color: rgba(var(--theme-color-rgb), 0.34);
  background-color: rgba(var(--theme-color-rgb), 0.16);
  color: #ffffff;
  box-shadow: none;
}

.node-items {

  display: flex;

  flex-direction: column;

  gap: 1rem;

}



.node-item {

  display: flex;

  align-items: center;

  padding: 1rem 1.25rem;

  border-radius: 12px;

  background-color: var(--card-bg);

  transition: all 0.25s ease;

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  border: 1px solid var(--border-color);

  

  &:hover {

    transform: translateY(-2px);

    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);

    border-color: rgba(var(--theme-color-rgb), 0.3);

  }

  

  .node-status {

    margin-right: 1rem;

    

    .status-indicator {

      width: 12px;

      height: 12px;

      border-radius: 50%;

      background-color: #ccc;

      position: relative;

      

      &.online {

        background-color: #4caf50;

        box-shadow: 0 0 0 rgba(76, 175, 80, 0.4);

        animation: pulse 2s infinite;

      }

    }

  }

  

  .node-info {

    flex: 1;

    overflow: hidden;

    

    .node-tags {

      display: flex;

      flex-wrap: wrap;

      gap: 0.5rem;

      margin-bottom: 0.5rem;

      

      .node-tag {

        font-size: 0.75rem;

        padding: 0.2rem 0.5rem;

        border-radius: 4px;

        background-color: rgba(var(--theme-color-rgb), 0.1);

        color: var(--theme-color);

        

        &.rate-tag {

          background-color: rgba(76, 175, 80, 0.1);

          color: #4caf50;

          font-weight: 600;

        }

        

        &.type-tag {

          background-color: rgba(33, 150, 243, 0.1);

          color: #2196f3;

        }

      }

    }

    

    .node-name {

      font-size: 1rem;

      font-weight: 600;

      margin: 0 0 0.35rem;

      color: var(--text-color);

      line-height: 1.4;

      overflow: hidden;

      text-overflow: ellipsis;

      display: -webkit-box;

      -webkit-line-clamp: 2;

      line-clamp: 2;

      -webkit-box-orient: vertical;

    }

    

    .node-host {

      font-size: 0.8rem;

      color: var(--text-muted);

      margin: 0;

    }

  }

  

  .node-actions {

    display: flex;

    align-items: center;

    margin-left: 12px;

    

    .more-btn {

      background: none;

      border: none;

      width: 32px;

      height: 32px;

      border-radius: 50%;

      display: flex;

      align-items: center;

      justify-content: center;

      color: var(--text-muted);

      cursor: pointer;

      transition: all 0.2s ease;

      

      &:hover {

        background-color: rgba(var(--theme-color-rgb), 0.1);

        color: var(--theme-color);

      }

    }

  }

}





.nodes-loading,

.nodes-error,

.nodes-empty {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding: 3rem 1rem;

  text-align: center;

  border-radius: 28px;

  overflow: hidden;

  

  p {

    margin-top: 1rem;

    color: var(--text-muted);

    font-size: 1.1rem;

  }

  

  .error-icon, 

  .empty-icon {

    color: var(--text-muted);

    opacity: 0.7;

  }

}



.retry-button {

  margin-top: 1.5rem;

  height: 40px;

  min-width: 120px;

  padding: 0 16px;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  border-radius: 8px;

  background-color: rgba(var(--theme-color-rgb), 0.85);

  color: white;

  font-weight: 500;

  font-size: 14px;

  border: 1px solid rgba(var(--theme-color-rgb), 0.3);

  box-shadow: 0 8px 20px rgba(var(--theme-color-rgb), 0.25);

  cursor: pointer;

  transition: all 0.3s ease;

  backdrop-filter: blur(8px);

  -webkit-backdrop-filter: blur(8px);

  

  &:hover {

    transform: translateY(-2px);

    box-shadow: 0 10px 25px rgba(var(--theme-color-rgb), 0.35);

    background-color: rgba(var(--theme-color-rgb), 0.95);

  }

  

  &:active {

    transform: translateY(0);

    box-shadow: 0 5px 15px rgba(var(--theme-color-rgb), 0.3);

  }

}





@keyframes pulse {

  0% {

    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);

  }

  70% {

    box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);

  }

  100% {

    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);

  }

}





@media (min-width: 768px) {

  .node-items {

    display: grid;

    grid-template-columns: repeat(2, 1fr);

    gap: 1rem;

  }

}



@media (min-width: 1024px) {

  .node-items {

    grid-template-columns: repeat(4, minmax(0, 1fr));

  }

}

.dashboard-card,
.node-item,
.nodes-loading,
.nodes-error,
.nodes-empty {
  background-color: var(--card-background);
  border: 1px solid var(--card-border-color, var(--border-color));
  box-shadow: none;
}

.dashboard-card:hover,
.node-item:hover {
  border-color: var(--card-hover-border-color, var(--theme-color));
  box-shadow: none;
  transform: none;
}

.node-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    "status tags actions"
    ". name actions"
    ". host actions";
  align-items: start;
  column-gap: 12px;
  row-gap: 10px;
  min-height: 112px;
  padding: 18px 20px;
}

.node-status {
  grid-area: status;
  padding-top: 3px;
  margin-right: 0;
}

.node-status .status-indicator {
  width: 10px;
  height: 10px;
}

.node-info {
  display: contents;
}

.node-tags {
  grid-area: tags;
  align-items: center;
  gap: 6px;
  margin-bottom: 0;
  min-width: 0;
}

.node-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid rgba(var(--theme-color-rgb), 0.18);
  border-radius: 6px;
  font-size: 12px;
  line-height: 1;
}

.node-name {
  grid-area: name;
  margin: 0;
  font-size: 15px;
  line-height: 1.45;
}

.node-host {
  grid-area: host;
  margin: -2px 0 0;
  font-size: 12px;
  line-height: 1.4;
}

.node-actions {
  grid-area: actions;
  align-self: start;
  margin-left: 0;
}

.more-btn {
  border-radius: 8px;
}

.more-btn,
.retry-button {
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.more-btn:hover,
.retry-button:hover {
  box-shadow: none;
  transform: none;
}

.status-indicator.online {
  box-shadow: none;
  animation: none;
}

.node-item {
  display: flex;
  min-height: 108px;
  padding: 18px;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.node-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.node-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--card-border-color, var(--border-color));
  border-radius: 7px;
  background-color: var(--card-background);
  flex: 0 0 auto;
}

.node-status .status-indicator {
  width: 10px;
  height: 10px;
}

.node-tags {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  min-height: 26px;
  flex-wrap: wrap;
}

.node-tag {
  justify-content: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0;
  white-space: nowrap;
}

.node-info {
  display: block;
  min-width: 0;
}

.node-name {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.4;
  color: var(--heading-color, var(--text-color));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-host {
  margin: 6px 0 0;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-btn {
  width: 30px;
  height: 30px;
  color: var(--text-muted);
  border-radius: 8px;
}

.more-btn:hover {
  background-color: var(--card-hover-background, rgba(var(--theme-color-rgb), 0.08));
  color: var(--theme-color);
}

/* Final node card composition. Keep this block last to neutralize older layout rules above. */
.nodes-container .node-items {
  gap: 16px;
  position: relative;
  z-index: 1;
}

.nodes-container .node-item {
  position: relative !important;
  display: flex !important;
  min-height: 132px;
  padding: 20px 48px 20px 20px;
  flex-direction: column !important;
  justify-content: space-between;
  align-items: stretch !important;
  gap: 22px;
  border-radius: 18px;
  background-color: var(--card-background);
}

.nodes-container .node-card-top {
  display: flex !important;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-width: 0;
}

.nodes-container .node-meta {
  display: flex !important;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.nodes-container .node-status {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  flex: 0 0 28px;
  border: 1px solid rgba(76, 175, 80, 0.22);
  border-radius: 8px;
  background-color: rgba(76, 175, 80, 0.08);
}

.nodes-container .status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background-color: #a8adb5;
}

.nodes-container .status-indicator.online {
  background-color: #58b957;
  animation: none;
  box-shadow: none;
}

.nodes-container .node-tags {
  display: flex !important;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 28px;
  margin: 0;
  flex-wrap: wrap;
}

.nodes-container .node-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  background-color: rgba(var(--theme-color-rgb), 0.08);
  border: 1px solid rgba(var(--theme-color-rgb), 0.18);
  color: var(--theme-color);
}

.nodes-container .node-tag.rate-tag {
  background-color: rgba(76, 175, 80, 0.1) !important;
  border-color: rgba(76, 175, 80, 0.28) !important;
  color: #3f9d43 !important;
}

.nodes-container .node-tag.type-tag {
  background-color: rgba(33, 150, 243, 0.09) !important;
  border-color: rgba(33, 150, 243, 0.24) !important;
  color: #2f72e5 !important;
}

.nodes-container .node-actions {
  position: absolute !important;
  top: 17px;
  right: 16px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0 !important;
}

.nodes-container .more-btn {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  color: var(--text-muted);
  background-color: transparent;
  border: 0 !important;
}

.nodes-container .more-btn:hover {
  background-color: var(--card-hover-background, rgba(var(--theme-color-rgb), 0.08));
  color: var(--theme-color);
}

.nodes-container .node-info {
  display: block !important;
  min-width: 0;
  padding: 0;
}

.nodes-container .node-name {
  display: block;
  margin: 0;
  color: var(--heading-color, var(--text-color));
  font-size: 16px;
  font-weight: 650;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nodes-container .node-host {
  display: block;
  margin: 7px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 767px) {
  .nodes-container .node-item {
    min-height: 118px;
    padding: 18px 46px 18px 18px;
    gap: 18px;
  }
}

</style> 
