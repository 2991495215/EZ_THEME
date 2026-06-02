<template>
  <div class="dashboard-container">
    <div class="dashboard-inner">
      <AppCard v-if="false" class="dashboard-card welcome-card" :class="{'card-animate': !loading.userInfo}" hoverable no-padding>
        <div class="card-header">
          <h2 class="card-title">{{ $t('dashboard.welcome') }}</h2>
        </div>
        <div class="card-body">
          <p class="">{{ $t('dashboard.welcomeDesc') }}</p>
          <p v-if="userStats.userEmail && DASHBOARD_CONFIG.showUserEmail" class="user-email">
            <IconMail :size="16"/>
            <span>{{ userStats.userEmail }}</span>
          </p>
        </div>
      </AppCard>

      <!-- 通知区域 -->
      <!-- 待处理事项提示 -->
      <AppCard v-if="hasPendingItems" class="dashboard-card pending-items-card"
           :class="{'card-animate': !loading.userStats}" style="animation-delay: 0.1s" hoverable no-padding>
        <div class="card-header">
          <h2 class="card-title">{{ $t('dashboard.pendingItems') }}</h2>
        </div>
        <div class="card-body">
          <div class="pending-items-list">
            <div v-if="userStats.pendingOrders > 0" class="pending-item" @click="router.push('/orders')">
              <div class="pending-icon">
                <IconShoppingCart :size="20"/>
              </div>
              <div class="pending-info">
                <span class="">{{ $t('dashboard.pendingOrders') }} ({{ userStats.pendingOrders }})</span>
              </div>
              <div class="pending-action">
                <IconChevronRight :size="16"/>
              </div>
            </div>

            <div v-if="userStats.pendingTickets > 0" class="pending-item" @click="goToSupport">
              <div class="pending-icon">
                <IconMessage :size="20"/>
              </div>
              <div class="pending-info">
                <span class="">{{ $t('dashboard.pendingTickets') }} ({{ userStats.pendingTickets }})</span>
              </div>
              <div class="pending-action">
                <IconChevronRight :size="16"/>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard class="dashboard-card notice-card" :class="{'card-animate': !loading.notices}"
           v-if="notices && notices.data && notices.data.length > 0" style="animation-delay: 0.2s" hoverable no-padding>
        <div class="card-header">
          <h2 class="card-title">{{ $t('dashboard.siteAnnouncement') }}</h2>
          <div class="notice-counter">
            {{ $t('common.noticeCount', {current: currentNoticeIndex + 1, total: notices.data.length}) }}
          </div>
        </div>
        <div v-if="loading.notices" class="card-body skeleton-loading">
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
        </div>
        <div v-else class="card-body">
          <transition name="fade-slide" mode="out-in">
            <div class="notice-item" v-if="notices.data[currentNoticeIndex]" :key="currentNoticeIndex">
              <div class="notice-title">{{ notices.data[currentNoticeIndex].title }}</div>
              <div class="notice-footer">
                <div class="notice-date">{{ formatDate(notices.data[currentNoticeIndex].created_at) }}</div>
                <div class="notice-nav">
                  <button
                      class="btn-notice"
                      @click="prevNotice"
                      :disabled="currentNoticeIndex <= 0">
                    <IconChevronLeft :size="16"/>
                    {{ $t('common.prevNotice') }}
                  </button>
                  <button
                      class="btn-notice"
                      @click="showNoticeModal">
                    <IconEye :size="16"/>
                    {{ $t('common.viewDetails') }}
                  </button>
                  <button
                      class="btn-notice"
                      @click="nextNotice"
                      :disabled="currentNoticeIndex >= notices.data.length - 1">
                    {{ $t('common.nextNotice') }}
                    <IconChevronRight :size="16"/>
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </AppCard>

      <!-- 公告弹窗 -->
      <transition name="fade">
        <div v-if="showNoticeDetails" class="notice-modal-overlay" @click="closeNoticeModal">
          <transition name="popup-slide">
            <div v-if="showNoticeDetails" class="notice-modal" :class="noticeModalThemeClass" :style="noticeModalStyle" @click.stop>
              <div class="notice-modal-header">
                <h2 class="popup-title">{{ notices.data[currentNoticeIndex].title }}</h2>
                <button class="popup-close-btn" @click="closeNoticeModal">
                  <IconX :size="20"/>
                </button>
              </div>
              <div class="notice-modal-content">
                <div v-html="processedNoticeContent" class="notice-content"></div>
              </div>
              <div class="notice-modal-footer">
                <button class="popup-action-btn adaptive-btn" @click="closeNoticeModal">
                  {{ $t('common.close') }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </transition>

      <!-- 套餐信息卡片 -->
      <AppCard v-if="hasPlan" class="dashboard-card subscription-card" :class="{'card-animate': !loading.userInfo}"
           style="animation-delay: 0.3s" hoverable no-padding>
        <div v-if="loading.userInfo" class="skeleton-card">
          <div class="skeleton-header"></div>
          <div class="skeleton-body">
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
          </div>
        </div>
        <template v-else>
          <div class="card-header">
            <h2 class="card-title">{{ $t('dashboard.subscriptionInfo') }}</h2>
          </div>
          <div class="card-body">
            <div class="subscription-info">
              <div class="info-item">
                <span class="info-label">{{ $t('dashboard.planName') }}</span>
                <span class="info-value">{{ userPlan.name || $t('dashboard.noSubscription') }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('dashboard.expiryDate') }}</span>
                <span class="info-value">
                  {{
                    userPlan.isExpireDatePermanent ? $t('dashboard.permanent') : (userPlan.expireDate || $t('dashboard.none'))
                  }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('dashboard.planTraffic') }}</span>
                <span class="info-value">{{ userPlan.totalTraffic || '0 GB' }}</span>
              </div>
              <!-- 添加下次重置时间，只有当resetDay存在时才显示 -->
              <div class="info-item" v-if="userPlan.resetDay">
                <span class="info-label">{{ $t('dashboard.nextResetTime') }}</span>
                <span class="info-value">{{ userPlan.resetDay }} {{ $t('dashboard.days') }}</span>
              </div>
              <!-- 添加在线设备信息，仅当面板类型为 Xiao-board 时显示 -->
              <div class="info-item" v-if="showDeviceLimit">
                <span class="info-label">{{ $t('dashboard.deviceLimit') }}</span>
                <span class="info-value">
                  {{
                    userPlan.deviceLimit === null ? `${userPlan.aliveIp} / ${$t('dashboard.unlimited')}` : `${userPlan.aliveIp} / ${userPlan.deviceLimit}`
                  }}
                </span>
              </div>
            </div>
            <div class="subscription-actions">
              <button v-if="showImportSubscription" class="btn-outline import-subscription-btn" :class="{
                'btn-active': showImportCard,
                'btn-highlight-btnbgcolor': DASHBOARD_CONFIG.importButtonHighlightBtnbgcolor
              }" @click="toggleImportCard">
                <IconShare :size="16" class="btn-icon"/>
                <span class="">{{ $t('dashboard.importSubscription') }}</span>
              </button>
              <button
                  v-if="showRenewPlanButton"
                  class="btn-outline renew-plan-btn"
                  :class="{
                  'renew-warning': isExpiringSoon && !isExpired,
                  'renew-danger': isExpired
                }"
                  @click="renewPlan"
              >
                <IconShoppingCart :size="16" class="btn-icon"/>
                <span class="">{{ $t('dashboard.renewPlan') }}</span>
              </button>
              <!-- 重置流量按钮 - 根据配置和流量状态显示 -->
              <button
                  v-if="showResetTrafficButton"
                  class="btn-outline reset-traffic-btn"
                  :class="{
                  'reset-warning': isLowTraffic && !isTrafficDepleted,
                  'reset-danger': isTrafficDepleted
                }"
                  @click="openResetTrafficModal"
              >
                <IconRefresh :size="16" class="btn-icon"/>
                <span class="">{{ $t('dashboard.resetTraffic') }}</span>

              </button>
              <button class="btn-outline" v-if="allowNewPeriod==='1'&&showResetTrafficButton" @click="showPopup=true">
                <IconCalendarPlus :size="16" class="btn-icon"/>
                <span>{{ $t('dashboard.activateDataCycleInAdvance') }}</span>
              </button>
              <button class="btn-outline" @click="goToSupport">
                <IconMessage :size="16" class="btn-icon"/>
                <span class="">{{ $t('dashboard.ticketSupport') }}</span>
              </button>
            </div>
          </div>
        </template>
      </AppCard>

      <!-- 订阅导入卡片 -->
      <transition name="import-card-transition">
        <div v-if="showImportCard && userPlan.subscribeUrl" class="import-card-shell">
          <AppCard class="dashboard-card import-card" hoverable no-padding>
          <div class="card-header">
            <h2 class="card-title">{{ $t('dashboard.importSubscription') }}</h2>
            <button class="close-btn" @click="showImportCard = false">
              <span class="close-icon"></span>
            </button>
          </div>
          <div class="card-body">
            <div class="import-action copy-action" @click="copySubscription">
              <div class="import-icon">
                <IconCopy :size="24"/>
              </div>
              <div class="import-content">
                <div class="import-title">{{ $t('dashboard.copySubscription') }}</div>
                <div class="import-desc">{{ $t('dashboard.copySubscriptionDesc') }}</div>
              </div>
            </div>

            <div class="import-action qrcode-action" @click="showQrCode = true">
              <div class="import-icon">
                <IconQrcode :size="24"/>
              </div>
              <div class="import-content">
                <div class="import-title">{{ $t('dashboard.scanQRCode') }}</div>
                <div class="import-desc">{{ $t('dashboard.scanQRCodeDesc') }}</div>
              </div>
            </div>

            <!-- 平台选择器 -->
            <div class="platform-selector">
              <button
                  v-for="platform in platforms"
                  :key="platform.id"
                  class="platform-button"
                  :class="{ 'active': activePlatform === platform.id }"
                  @click="activePlatform = platform.id"
              >
                <component :is="platform.icon" :size="16"/>
                <span>{{ $t(`platforms.${platform.id}`) }}</span>
              </button>
            </div>

            <!-- iOS平台选项 -->
            <transition name="platform-section-transition" mode="out-in">
              <div v-if="activePlatform === 'ios'" key="ios" class="platform-section">
              <div class="platform-title">iOS</div>
              <div v-if="hasIOSClients" class="platform-options">
                <div v-if="clientConfig.showShadowrocket" class="platform-option"
                     @click="importToClient('shadowrocket')">
                  <img :src="shadowrocketIcon" class="client-icon" alt="Shadowrocket"/>
                  <span>Shadowrocket</span>
                </div>
                <div v-if="clientConfig.showSurge" class="platform-option" @click="importToClient('surge')">
                  <img :src="surgeIcon" class="client-icon" alt="Surge"/>
                  <span>Surge</span>
                </div>
                <div v-if="clientConfig.showStash" class="platform-option" @click="importToClient('stash')">
                  <img :src="stashIcon" class="client-icon" alt="Stash"/>
                  <span>Stash</span>
                </div>
                <div v-if="clientConfig.showQuantumultX" class="platform-option" @click="importToClient('quantumultx')">
                  <img :src="quantumultIcon" class="client-icon" alt="Quantumult X"/>
                  <span>Quantumult X</span>
                </div>
                <div v-if="clientConfig.showHiddifyIOS" class="platform-option" @click="importToClient('hiddify-ios')">
                  <img :src="hiddifyMacIcon" class="client-icon" alt="Hiddify"/>
                  <span>Hiddify</span>
                </div>
                <div v-if="clientConfig.showSingboxIOS" class="platform-option" @click="importToClient('singbox-ios')">
                  <img :src="singboxIcon" class="client-icon" alt="Singbox"/>
                  <span>Singbox</span>
                </div>
                <div v-if="clientConfig.showLoon" class="platform-option" @click="importToClient('loon')">
                  <img :src="loonIcon" class="client-icon" alt="Loon"/>
                  <span>Loon</span>
                </div>
              </div>
              <div v-else class="no-clients-message">
                <p>{{ $t('dashboard.noClientsAvailable') }}</p>
              </div>
            </div>

            <!-- Android平台选项 -->
            <div v-else-if="activePlatform === 'android'" key="android" class="platform-section">
              <div class="platform-title">Android</div>
              <div v-if="hasAndroidClients" class="platform-options">
                <div v-if="clientConfig.showFlClashAndroid" class="platform-option" @click="importToClient('flclash')">
                  <img :src="flclashIcon" class="client-icon" alt="FlClash"/>
                  <span>FlClash</span>
                </div>
                <div v-if="clientConfig.showV2rayNG" class="platform-option" @click="importToClient('v2rayng')">
                  <img :src="v2rayNGIcon" class="client-icon" alt="V2rayNG"/>
                  <span>V2rayNG</span>
                </div>
                <div v-if="clientConfig.showClashAndroid" class="platform-option"
                     @click="importToClient('clash-android')">
                  <img :src="clashAndroidIcon" class="client-icon" alt="Clash"/>
                  <span>Clash</span>
                </div>
                <div v-if="clientConfig.showSurfboard" class="platform-option" @click="importToClient('surfboard')">
                  <img :src="surfboardIcon" class="client-icon" alt="Surfboard"/>
                  <span>Surfboard</span>
                </div>
                <div v-if="clientConfig.showClashMetaAndroid" class="platform-option"
                     @click="importToClient('clash-meta-android')">
                  <img :src="clashMetaAndroidIcon" class="client-icon" alt="Clash Meta"/>
                  <span>Clash Meta</span>
                </div>
                <div v-if="clientConfig.showNekobox" class="platform-option" @click="importToClient('nekobox')">
                  <img :src="nekoboxIcon" class="client-icon" alt="Nekobox"/>
                  <span>Nekobox</span>
                </div>
                <div v-if="clientConfig.showSingboxAndroid" class="platform-option"
                     @click="importToClient('singbox-android')">
                  <img :src="singboxAndroidIcon" class="client-icon" alt="Singbox"/>
                  <span>Singbox</span>
                </div>
                <div v-if="clientConfig.showHiddifyAndroid" class="platform-option"
                     @click="importToClient('hiddify-android')">
                  <img :src="hiddifyAndroidIcon" class="client-icon" alt="Hiddify"/>
                  <span>Hiddify</span>
                </div>
              </div>
              <div v-else class="no-clients-message">
                <p>{{ $t('dashboard.noClientsAvailable') }}</p>
              </div>
            </div>

            <!-- Windows平台选项 -->
            <div v-else-if="activePlatform === 'windows'" key="windows" class="platform-section">
              <div class="platform-title">Windows</div>
              <div v-if="hasWindowsClients" class="platform-options">
                <div v-if="clientConfig.showFlClashWindows" class="platform-option" @click="importToClient('flclash')">
                  <img :src="flclashIcon" class="client-icon" alt="FlClash"/>
                  <span>FlClash</span>
                </div>
                <div v-if="clientConfig.showClashVergeWindows" class="platform-option" @click="importToClient('clashverge')">
                  <img :src="clashvergeIcon" class="client-icon" alt="ClashVerge"/>
                  <span>ClashVerge</span>
                </div>
                <div v-if="clientConfig.showClashWindows" class="platform-option" @click="importToClient('clash')">
                  <img :src="clashWindowsIcon" class="client-icon" alt="Clash"/>
                  <span>Clash</span>
                </div>
                <div v-if="clientConfig.showNekoray" class="platform-option" @click="importToClient('nekoray')">
                  <img :src="nekorayIcon" class="client-icon" alt="Nekoray"/>
                  <span>Nekoray</span>
                </div>
                <div v-if="clientConfig.showSingboxWindows" class="platform-option"
                     @click="importToClient('singbox-windows')">
                  <img :src="singboxWindowsIcon" class="client-icon" alt="Singbox"/>
                  <span>Singbox</span>
                </div>
                <div v-if="clientConfig.showHiddifyWindows" class="platform-option"
                     @click="importToClient('hiddify-windows')">
                  <img :src="hiddifyWindowsIcon" class="client-icon" alt="Hiddify"/>
                  <span>Hiddify</span>
                </div>
              </div>
              <div v-else class="no-clients-message">
                <p>{{ $t('dashboard.noClientsAvailable') }}</p>
              </div>
            </div>

            <!-- MacOS平台选项 -->
            <div v-else-if="activePlatform === 'macos'" key="macos" class="platform-section">
              <div class="platform-title">MacOS</div>
              <div v-if="hasMacOSClients" class="platform-options">
                <div v-if="clientConfig.showFlClashMac" class="platform-option" @click="importToClient('flclash')">
                  <img :src="flclashIcon" class="client-icon" alt="FlClash"/>
                  <span>FlClash</span>
                </div>
                <div v-if="clientConfig.showClashVergeMac" class="platform-option" @click="importToClient('clashverge')">
                  <img :src="clashvergeIcon" class="client-icon" alt="ClashVerge"/>
                  <span>ClashVerge</span>
                </div>
                <div v-if="clientConfig.showClashX" class="platform-option" @click="importToClient('clashx')">
                  <img :src="clashXIcon" class="client-icon" alt="ClashX"/>
                  <span>ClashX</span>
                </div>
                <div v-if="clientConfig.showClashMetaX" class="platform-option" @click="importToClient('clashx-meta')">
                  <img :src="clashMetaXIcon" class="client-icon" alt="ClashX Meta"/>
                  <span>ClashX Meta</span>
                </div>
                <div v-if="clientConfig.showSurgeMac" class="platform-option" @click="importToClient('surge-mac')">
                  <img :src="surgeMacIcon" class="client-icon" alt="Surge"/>
                  <span>Surge</span>
                </div>
                <div v-if="clientConfig.showStashMac" class="platform-option" @click="importToClient('stash-mac')">
                  <img :src="stashMacIcon" class="client-icon" alt="Stash"/>
                  <span>Stash</span>
                </div>
                <div v-if="clientConfig.showQuantumultXMac" class="platform-option"
                     @click="importToClient('quantumultx-mac')">
                  <img :src="quantumultXMacIcon" class="client-icon" alt="Quantumult X"/>
                  <span>Quantumult X</span>
                </div>
                <div v-if="clientConfig.showSingboxMac" class="platform-option"
                     @click="importToClient('singbox-macos')">
                  <img :src="singboxMacIcon" class="client-icon" alt="Singbox"/>
                  <span>Singbox</span>
                </div>
                <div v-if="clientConfig.showHiddifyMac" class="platform-option"
                     @click="importToClient('hiddify-macos')">
                  <img :src="hiddifyMacIcon" class="client-icon" alt="Hiddify"/>
                  <span>Hiddify</span>
                </div>
              </div>
              <div v-else class="no-clients-message">
                <p>{{ $t('dashboard.noClientsAvailable') }}</p>
              </div>
            </div>
            </transition>
          </div>
          </AppCard>
        </div>
      </transition>

      <!-- QR码模态窗口 -->
      <transition name="fade">
        <div v-if="showQrCode" class="qrcode-modal-overlay" @click="showQrCode = false">
          <div class="qrcode-modal" @click.stop>
            <div class="qrcode-header">
              <h3>{{ $t('dashboard.scanQRCode') }}</h3>
              <button class="close-btn" @click="showQrCode = false">
                <span class="close-icon"></span>
              </button>
            </div>
            <div class="qrcode-content">
              <div v-if="qrCodeLoading" class="qrcode-loading">
                <div class="loading-spinner"></div>
                <p>{{ $t('common.loadingQRCode') }}</p>
              </div>
              <img v-else :src="qrCodeUrl" alt="QR Code" @load="qrCodeLoaded"/>
            </div>
          </div>
        </div>
      </transition>

      <div class="stats-grid">
        <template v-if="loading.userStats">
          <AppCard v-for="i in 4" :key="i" class="stats-card skeleton-card" variant="stats" no-padding>
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-row-sm"></div>
              <div class="skeleton-row-xs"></div>
            </div>
          </AppCard>
        </template>

        <template v-else-if="!hasPlan">
          <!-- 没有套餐时显示的提示卡片 -->
          <AppCard class="dashboard-card stats-card no-plan-card" :class="{'card-animate': !loading.userStats}"
               style="animation-delay: 0.5s; grid-column: span 4; margin: 0 auto; max-width: 1200px; width: 100%;" variant="stats" hoverable no-padding>
            <div class="no-plan-content">
              <div class="no-plan-icon">
                <IconShoppingCart :size="45" class="icon-cart"/>
              </div>
              <div class="no-plan-message">
                <div class="no-plan-title">{{ $t('dashboard.noPlanPrompt') }}</div>
                <div class="no-plan-actions">
                  <button class="action-button primary" @click="goToShop">
                    <IconShoppingBag :size="18" class="btn-icon"/>
                    <span>{{ $t('dashboard.purchasePlan') }}</span>
                  </button>
                  <button class="action-button secondary" @click="goToSupport">
                    <IconMessage :size="18" class="btn-icon"/>
                    <span>{{ $t('dashboard.ticketSupport') }}</span>
                  </button>
                </div>
              </div>
            </div>
          </AppCard>
        </template>

        <template v-else>
          <AppCard class="stats-card"
               :class="{
              'card-animate': !loading.userStats,
              'warning-card': isLowTraffic && !isTrafficDepleted,
              'danger-card': isTrafficDepleted
            }"
               style="animation-delay: 0.5s" variant="stats" hoverable no-padding>
            <div class="stats-icon">
              <IconTransferVertical :size="32"/>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ userStats.remainingTraffic }}</div>
              <div class="stats-label">{{ $t('dashboard.remainingTraffic') }}</div>
            </div>

            <!-- 水流进度条效果 -->
            <div class="water-container">
              <div class="water-progress"
                   :class="{'animate-water': waterAnimationState.canAnimate}"
                   :style="{ height: waterAnimationState.canAnimate ? `${trafficPercentage}%` : '0%' }">
              </div>
            </div>
          </AppCard>

          <AppCard class="stats-card"
               :class="{
              'card-animate': !loading.userStats,
              'warning-card': isExpiringSoon && !isExpired,
              'danger-card': isExpired
            }"
               style="animation-delay: 0.6s" variant="stats" hoverable no-padding>
            <div class="stats-icon">
              <IconCalendar :size="32"/>
            </div>
            <div class="stats-info">
              <div class="stats-value">
                {{
                  userStats.isRemainingDaysPermanent ? $t('dashboard.permanent') : userStats.remainingDays + $t('dashboard.days')
                }}
              </div>
              <div class="stats-label">{{ $t('dashboard.remainingDays') }}</div>
            </div>
          </AppCard>

          <AppCard class="stats-card"
               :class="{'card-animate': !loading.userStats, 'balance-card': true, 'clickable': isXiaoPanel}"
               style="animation-delay: 0.7s"
               @click="isXiaoPanel ? navigateToDeposit() : null"
               :style="isXiaoPanel ? { cursor: 'pointer' } : {}" variant="stats" :hoverable="isXiaoPanel" no-padding>
            <div class="stats-icon">
              <IconWallet :size="32"/>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ userStats.accountBalance }}</div>
              <div class="stats-label">{{ $t('dashboard.accountBalance') }}</div>
            </div>
            <div v-if="isXiaoPanel" class="chevron-icon">
              <IconChevronRight :size="20"/>
            </div>
          </AppCard>

          <AppCard class="stats-card doc-card"
               :class="{'card-animate': !loading.userStats}"
               style="animation-delay: 0.8s"
               variant="stats" hoverable no-padding
               @click="openDocumentation">
            <div class="stats-icon">
              <IconFileText :size="32"/>
            </div>
            <div class="stats-info">
              <div class="stats-value">查看帮助</div>
              <div class="stats-label">使用文档</div>
            </div>
            <div class="chevron-icon">
              <IconChevronRight :size="20"/>
            </div>
          </AppCard>
        </template>
      </div>

      <!--
      <AppCard class="dashboard-card download-card" :class="{'card-animate': !loading.userInfo}"
           v-if="clientConfig.showDownloadCard" style="animation-delay: 0.9s" hoverable no-padding>
        <div class="card-header">
          <h2 class="card-title">{{ $t('dashboard.officialClients') }}</h2>
        </div>
        <div class="card-body">
          <div class="download-options">
            <div class="download-option" v-if="clientConfig.showIOS" @click="downloadClient('ios')">
              <div class="option-icon ios">
                <IconBrandApple :size="32"/>
              </div>
              <div class="option-name">iOS</div>
            </div>

            <div class="download-option" v-if="clientConfig.showAndroid" @click="downloadClient('android')">
              <div class="option-icon android">
                <IconBrandAndroid :size="32"/>
              </div>
              <div class="option-name">Android</div>
            </div>

            <div class="download-option" v-if="clientConfig.showMacOS" @click="downloadClient('macos')">
              <div class="option-icon macos">
                <IconBrandFinder :size="32"/>
              </div>
              <div class="option-name">MacOS</div>
            </div>

            <div class="download-option" v-if="clientConfig.showWindows" @click="downloadClient('windows')">
              <div class="option-icon windows">
                <IconBrandWindows :size="32"/>
              </div>
              <div class="option-name">Windows</div>
            </div>

            <div class="download-option" v-if="clientConfig.showLinux" @click="downloadClient('linux')">
              <div class="option-icon linux">
                <IconBrandDebian :size="32"/>
              </div>
              <div class="option-name">Linux</div>
            </div>

            <div class="download-option" v-if="clientConfig.showOpenWrt" @click="downloadClient('openwrt')">
              <div class="option-icon openwrt">
                <IconRouter :size="32"/>
              </div>
              <div class="option-name">OpenWrt</div>
            </div>
          </div>
        </div>
      </AppCard>
      -->

      <AppCard class="dashboard-card ip-check-card" :class="{'card-animate': !loading.userStats}" style="animation-delay: 0.95s" hoverable no-padding>
        <div class="card-header ip-check-header">
          <div>
            <h2 class="card-title">当前出口检测</h2>
            <div class="ip-check-subtitle">实时查看当前 IP、归属地与风险状态</div>
          </div>
          <a
              class="ip-check-action"
              href="https://ip.net.coffee/ip/"
              target="_blank"
              rel="noopener noreferrer"
          >
            查看评分
            <IconChevronRight :size="16"/>
          </a>
        </div>
        <div class="card-body ip-check-body">
          <div class="ip-check-copy">
            <div class="ip-check-title">确认你的代理出口是否生效</div>
            <div class="ip-check-desc">切换节点后快速确认出口位置、ASN 归属和风险画像。</div>
          </div>
          <div class="ip-card-display" @click="playIpCardEffect">
            <span
                v-for="popup in ipCardPopups"
                :key="popup.id"
                class="ip-card-popup"
                :style="{ left: `${popup.x}%`, top: `${popup.y}%` }"
            >{{ popup.text }}</span>
            <img
                class="ip-card-image"
                :src="ipCardImageSrc"
                alt="当前出口 IP 信息"
                loading="lazy"
            />
          </div>
        </div>
      </AppCard>

      <section v-if="!loading.userInfo && !loading.userStats" class="dashboard-card client-guide-section card-animate" style="animation-delay: 1s">
        <div class="client-guide-tabs" aria-label="选择系统" role="tablist">
          <button
              v-for="platform in clientGuidePlatforms"
              :key="platform.id"
              class="client-guide-tab"
              :class="{'active': activeClientGuidePlatform === platform.id}"
              type="button"
              role="tab"
              :aria-selected="activeClientGuidePlatform === platform.id"
              @click="activeClientGuidePlatform = platform.id"
          >
            <component :is="platform.icon" :size="platform.iconSize"/>
            <span>{{ platform.label }}</span>
          </button>
        </div>

        <transition name="client-list-switch" mode="out-in">
          <div class="client-download-list" :key="activeClientGuidePlatform">
            <button
                v-for="client in clientGuideCards"
                :key="client.name"
                class="client-download-item"
                type="button"
                @click="openClientGuideDownload(client)"
            >
              <span class="client-download-info">
                <span class="client-guide-icon-wrap">
                  <img v-if="client.icon" :src="client.icon" :alt="client.name" class="client-guide-icon"/>
                  <component v-else :is="client.fallbackIcon" :size="32" class="client-guide-icon-fallback"/>
                </span>
                <span class="client-download-name">{{ client.name }}</span>
              </span>
              <span class="client-download-action">
                <IconDownload :size="18"/>
                <span>下载客户端</span>
              </span>
            </button>
          </div>
        </transition>
      </section>
    </div>
    <!-- 弹窗组件 -->
    <CommonDialog
        :show-dialog="showPopup"
        :title="$t('invite.withdraw.tip')"
        :content="$t('dashboard.resetDataCycleNotice')"
        cancel-button-i18n-key="profile.cancel"
        confirm-button-i18n-key="profile.iKnow"
        @close="handlePopupClose"
        @confirm="handlePopupConfirm"
    />

  </div>

  <!-- 重置流量确认弹窗 -->
  <transition name="modal-fade">
    <div class="modal-overlay" v-if="showResetTrafficModal">
      <div class="modal-container">
        <div class="modal-card reset-traffic-modal">
          <div class="modal-header">
            <h3>{{ $t('dashboard.resetTrafficConfirm') }}</h3>
            <button class="close-button" @click="closeResetTrafficModal">×</button>
          </div>
          <div class="modal-body">
            <div class="warning-icon">
              <IconAlertTriangle :size="48"/>
            </div>
            <p class="warning-text">{{ $t('dashboard.resetTrafficDesc') }}</p>
            <p class="note-text">{{ $t('dashboard.resetTrafficWarning') }}</p>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="closeResetTrafficModal">
              {{ $t('common.cancel') }}
            </button>
            <button
                class="confirm-btn"
                :disabled="resetConfirmCooldown > 0 || isCreatingResetOrder"
                @click="createResetTrafficOrder"
            >
              <template v-if="isCreatingResetOrder">
                <span class="loading-container">
                  <div class="loader-small"></div>
                  <span>{{ $t('common.loading') }}</span>
                </span>
              </template>
              <template v-else>
                {{
                  resetConfirmCooldown > 0 ? `${$t('common.confirm')} (${resetConfirmCooldown})` : $t('common.confirm')
                }}
              </template>
            </button>
          </div>
        </div>
      </div>


    </div>
  </transition>

</template>

<script>
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from 'vue';
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {CLIENT_CONFIG, DASHBOARD_CONFIG, isXiaoV2board, SITE_CONFIG} from '@/utils/baseConfig';
import {
  IconAlertTriangle,
  IconBox,
  IconBrandAndroid,
  IconBrandApple,
  IconBrandDebian,
  IconBrandFinder,
  IconBrandGithub,
  IconBrandWindows,
  IconCalendar,
  IconCat,
  IconChevronLeft,
  IconChevronRight,
  IconCoins,
  IconCopy,
  IconCrosshair,
  IconDeviceDesktop,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconFileText,
  IconHelpCircle,
  IconMail,
  IconMessage,
  IconMoon,
  IconPackage,
  IconQrcode,
  IconRefresh,
  IconRocket,
  IconRouter,
  IconSend,
  IconShare,
  IconShoppingBag,
  IconShoppingCart,
  IconTransferVertical,
  IconUserPlus,
  IconWallet,
  IconWaveSawTool,
  IconWaveSine,
  IconX,
  IconCalendarPlus
} from '@tabler/icons-vue';
import CommonDialog from '@/components/popup/CommonDialog.vue';
import AppCard from '@/components/common/AppCard.vue';
import {useTheme} from '@/composables/useTheme';
import {usePerformanceMode} from '@/composables/usePerformanceMode';
import {getNotices, getSubscribe, getUserConfig, getUserInfo, getUserStats, setNextPeriod} from '@/api/dashboard';
import {useToast} from '@/composables/useToast';
import {submitOrder} from '@/api/shop';
import MarkdownIt from 'markdown-it';
import { sanitizeHtml } from '@/utils/sanitize';
import shadowrocketIconImg from '@/assets/images/client-img-ios/shadowrocket.png';
import surgeIconImg from '@/assets/images/client-img-ios/Surge.png';
import stashIconImg from '@/assets/images/client-img-ios/stash.png';
import quantumultIconImg from '@/assets/images/client-img-ios/quantumultx.png';
import singboxIconImg from '@/assets/images/client-img-ios/singbox.png';
import loonIconImg from '@/assets/images/client-img-ios/loon.png';
import v2rayNGIconImg from '@/assets/images/client-img-android/v2rayng.png';
import clashAndroidIconImg from '@/assets/images/client-img-android/clash.png';
import surfboardIconImg from '@/assets/images/client-img-android/surfboard.png';
import clashMetaAndroidIconImg from '@/assets/images/client-img-android/clashmeta.png';
import nekoboxIconImg from '@/assets/images/client-img-android/nekobox.png';
import singboxAndroidIconImg from '@/assets/images/client-img-android/singbox.png';
import hiddifyAndroidIconImg from '@/assets/images/client-img-android/hiddify.png';
import flclashIconImg from '@/assets/images/client-img-windows/flclash.png';
import clashvergeIconImg from '@/assets/images/client-img-windows/clashverge.png';
import clashWindowsIconImg from '@/assets/images/client-img-windows/clash.png';
import nekorayIconImg from '@/assets/images/client-img-windows/nekoray.png';
import singboxWindowsIconImg from '@/assets/images/client-img-windows/singbox.png';
import hiddifyWindowsIconImg from '@/assets/images/client-img-windows/hiddify.png';
import clashXIconImg from '@/assets/images/client-img-macos/clashx.png';
import clashMetaXIconImg from '@/assets/images/client-img-macos/clashmetax.png';
import surgeMacIconImg from '@/assets/images/client-img-macos/Surge.png';
import stashMacIconImg from '@/assets/images/client-img-macos/stash.png';
import quantumultXMacIconImg from '@/assets/images/client-img-macos/quantumultx.png';
import singboxMacIconImg from '@/assets/images/client-img-macos/singbox.png';
import hiddifyMacIconImg from '@/assets/images/client-img-macos/hiddify.png';

import {cleanupResources, createTimer} from '@/utils/componentLifecycle';
import {
  calculateTrafficPercentage,
  formatTrafficSize,
  isTrafficBelowThreshold,
  isTrafficEmpty
} from './composables/dashboardMetrics';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const hrefIndex = token.attrIndex('href');
  let href = '';

  if (hrefIndex >= 0) {
    href = token.attrs[hrefIndex][1];
  }

  if (href.includes('#eztheme-btn') || href.includes('class=eztheme-btn') || href.includes('?eztheme-btn')) {
    token.attrs[hrefIndex][1] = href
        .replace('#eztheme-btn', '')
        .replace('class=eztheme-btn', '')
        .replace('?eztheme-btn', '');

    const classIndex = token.attrIndex('class');
    if (classIndex < 0) {
      token.attrPush(['class', 'eztheme-btn']);
    } else {
      const classes = token.attrs[classIndex][1];
      if (!classes.includes('eztheme-btn')) {
        token.attrs[classIndex][1] = classes + ' eztheme-btn';
      }
    }
  }

  return self.renderToken(tokens, idx, options);
};

export default {
  name: 'UserDashboard',
  components: {
    IconBox,
    IconSend,
    IconCalendar,
    IconUserPlus,
    IconShoppingCart,
    IconFileText,
    IconWallet,
    IconBrandApple,
    IconBrandAndroid,
    IconBrandWindows,
    IconBrandDebian,
    IconRouter,
    IconBrandFinder,
    IconChevronRight,
    IconTransferVertical,
    IconShare,
    IconMessage,
    IconMail,
    IconChevronLeft,
    IconCopy,
    IconQrcode,
    IconRocket,
    IconWaveSine,
    IconDeviceDesktop,
    IconCrosshair,
    IconPackage,
    IconMoon,
    IconWaveSawTool,
    IconBrandGithub,
    IconCat,
    IconEyeOff,
    IconShoppingBag,
    IconHelpCircle,
    IconCoins,
    IconEye,
    IconRefresh,
    IconAlertTriangle,
    IconX,
    IconCalendarPlus,
    IconDownload,
    AppCard,
    CommonDialog
  },
  setup() {
    const {t, locale} = useI18n();
    const router = useRouter();
    const {theme} = useTheme();
    const {isPerformanceMode} = usePerformanceMode();
    const noticeModalThemeClass = computed(() => ({
      'notice-modal--dark': theme.value === 'dark'
    }));
    const ipCardImageSrc = computed(() => {
      const style = theme.value === 'dark' ? 'aurora' : 'snowy';
      const sticker = theme.value === 'dark' ? 'rainbow' : 'ghost';
      return `https://card.net.coffee/v1/card.svg?style=${style}&sticker=${sticker}&w=480`;
    });
    const ipCardPopups = ref([]);
    let ipCardPopupId = 0;
    const playIpCardEffect = () => {
      if (isPerformanceMode.value) return;

      const popups = ['👍', '✨', '🚀', '👌', '💫'];
      const text = popups[ipCardPopupId % popups.length];
      ipCardPopups.value = [
        ...ipCardPopups.value,
        {
          id: ++ipCardPopupId,
          text,
          x: 50 + (Math.random() - 0.5) * 22,
          y: 50 + (Math.random() - 0.5) * 18
        }
      ];

      const currentId = ipCardPopupId;
      setTimeout(() => {
        ipCardPopups.value = ipCardPopups.value.filter(popup => popup.id !== currentId);
      }, 950);
    };
    const clientConfig = reactive(CLIENT_CONFIG);
    const notices = ref([]);
    const autoRotateNotices = ref(true);
    const userPlan = ref({
      deviceLimit: null,
      aliveIp: 0,
      resetDay: null
    });
    const qrCodeLoading = ref(true);
    const showImportSubscription = ref(DASHBOARD_CONFIG.showImportSubscription)

    const languageChangedSignal = inject('languageChangedSignal', ref(0));

    const shadowrocketIcon = shadowrocketIconImg;
    const surgeIcon = surgeIconImg;
    const stashIcon = stashIconImg;
    const quantumultIcon = quantumultIconImg;
    const singboxIcon = singboxIconImg;
    const loonIcon = loonIconImg;

    const v2rayNGIcon = v2rayNGIconImg;
    const clashAndroidIcon = clashAndroidIconImg;
    const surfboardIcon = surfboardIconImg;
    const clashMetaAndroidIcon = clashMetaAndroidIconImg;
    const nekoboxIcon = nekoboxIconImg;
    const singboxAndroidIcon = singboxAndroidIconImg;
    const hiddifyAndroidIcon = hiddifyAndroidIconImg;

    const flclashIcon = flclashIconImg;
    const clashvergeIcon = clashvergeIconImg;
    const clashWindowsIcon = clashWindowsIconImg;
    const nekorayIcon = nekorayIconImg;
    const singboxWindowsIcon = singboxWindowsIconImg;
    const hiddifyWindowsIcon = hiddifyWindowsIconImg;

    const clashXIcon = clashXIconImg;
    const clashMetaXIcon = clashMetaXIconImg;
    const surgeMacIcon = surgeMacIconImg;
    const stashMacIcon = stashMacIconImg;
    const quantumultXMacIcon = quantumultXMacIconImg;
    const singboxMacIcon = singboxMacIconImg;
    const hiddifyMacIcon = hiddifyMacIconImg;

    const userStats = reactive({
      remainingTraffic: '',
      remainingDays: '',
      accountBalance: '0.00',
      pendingOrders: 0,
      pendingTickets: 0,
      userEmail: '',
      isRemainingDaysPermanent: false
    });
    const userBalance = ref('0.00');
    const currencySymbol = ref('$');
    const hasPlan = ref(true);
    const currentNoticeIndex = ref(0);
    const showNoticeDetails = ref(false);
    const showImportCard = ref(false);
    const showQrCode = ref(false);
    const {showToast} = useToast();
    const qrCodeUrl = ref('');

    //提前开启下月
    const allowNewPeriod = ref('')

    const platforms = [
      {id: 'ios', icon: 'IconBrandApple'},
      {id: 'android', icon: 'IconBrandAndroid'},
      {id: 'windows', icon: 'IconBrandWindows'},
      {id: 'macos', icon: 'IconBrandFinder'}
    ];

    const activePlatform = ref(detectUserPlatform());

    function detectUserPlatform() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
      }

      if (/android/i.test(userAgent)) {
        return 'android';
      }

      if (/Mac/.test(userAgent)) {
        return 'macos';
      }

      return 'windows';
    }

    const loading = reactive({
      userInfo: true,
      userStats: true,
      notices: true,
      userPlan: true,
      subscribe: true
    });

    const waterAnimationState = reactive({
      canAnimate: false,
      initialized: false
    });

    watch(() => [loading.userStats, loading.userInfo], ([userStatsLoading, userInfoLoading]) => {
      if (!userStatsLoading && !userInfoLoading) {
        setTimeout(() => {
          waterAnimationState.canAnimate = true;
          waterAnimationState.initialized = true;
        }, 500);
      }
    }, {immediate: false, flush: 'post'});

    watch(() => locale.value, () => {
      if (userPlan.value.isExpireDatePermanent) {
        userPlan.value.expireDate = t('dashboard.permanent');
      }
    });

    const clientGuidePlatforms = [
      {id: 'android', label: '安卓手机', icon: 'IconBrandAndroid', iconSize: 24},
      {id: 'ios', label: '苹果手机', icon: 'IconBrandApple', iconSize: 21},
      {id: 'windows', label: 'Win电脑', icon: 'IconBrandWindows', iconSize: 18},
      {id: 'macos', label: 'Mac电脑', icon: 'IconBrandApple', iconSize: 21}
    ];

    const activeClientGuidePlatform = ref('windows');

    const clientGuideData = {
      windows: [
        {
          name: 'FlClash',
          icon: flclashIconImg,
          fallbackIcon: 'IconDeviceDesktop',
          downloadUrl: 'https://github.com/chen08209/FlClash/releases/latest'
        },
        {
          name: 'Clash Verge',
          icon: clashvergeIconImg,
          fallbackIcon: 'IconDeviceDesktop',
          downloadUrl: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/latest'
        },
        {
          name: 'v2rayN',
          icon: v2rayNGIconImg,
          fallbackIcon: 'IconDeviceDesktop',
          downloadUrl: 'https://github.com/2dust/v2rayN/releases/latest'
        },
        {
          name: 'sing-box',
          icon: singboxWindowsIconImg,
          fallbackIcon: 'IconDeviceDesktop',
          downloadUrl: 'https://github.com/SagerNet/sing-box/releases/latest'
        }
      ],
      android: [
        {
          name: 'FlClash',
          icon: flclashIconImg,
          fallbackIcon: 'IconBrandAndroid',
          downloadUrl: 'https://github.com/chen08209/FlClash/releases/latest'
        },
        {
          name: 'Clash Meta',
          icon: clashMetaAndroidIconImg,
          fallbackIcon: 'IconBrandAndroid',
          downloadUrl: 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases/latest'
        },
        {
          name: 'v2rayNG',
          icon: v2rayNGIconImg,
          fallbackIcon: 'IconBrandAndroid',
          downloadUrl: 'https://github.com/2dust/v2rayNG/releases/latest'
        },
        {
          name: 'NekoBox',
          icon: nekoboxIconImg,
          fallbackIcon: 'IconBrandAndroid',
          downloadUrl: 'https://github.com/MatsuriDayo/NekoBoxForAndroid/releases/latest'
        },
        {
          name: 'sing-box',
          icon: singboxAndroidIconImg,
          fallbackIcon: 'IconBrandAndroid',
          downloadUrl: 'https://github.com/SagerNet/sing-box/releases/latest'
        }
      ],
      ios: [
        {
          name: 'Shadowrocket',
          icon: shadowrocketIconImg,
          fallbackIcon: 'IconBrandApple',
          downloadUrl: 'https://apps.apple.com/us/app/shadowrocket/id932747118'
        },
        {
          name: 'sing-box',
          icon: singboxIconImg,
          fallbackIcon: 'IconBrandApple',
          downloadUrl: 'https://apps.apple.com/us/app/sing-box/id6451272673'
        }
      ],
      macos: [
        {
          name: 'FlClash',
          icon: flclashIconImg,
          fallbackIcon: 'IconBrandFinder',
          downloadUrl: 'https://github.com/chen08209/FlClash/releases/latest'
        },
        {
          name: 'Clash Verge',
          icon: clashvergeIconImg,
          fallbackIcon: 'IconBrandFinder',
          downloadUrl: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/latest'
        },
        {
          name: 'sing-box',
          icon: singboxMacIconImg,
          fallbackIcon: 'IconBrandFinder',
          downloadUrl: 'https://github.com/SagerNet/sing-box/releases/latest'
        }
      ]
    };

    const clientGuideCards = computed(() => clientGuideData[activeClientGuidePlatform.value] || []);

    const openClientGuideLink = (url) => {
      if (!url) return;
      if (url.startsWith('/docs')) {
        router.push(url);
        return;
      }
      window.open(url, '_blank');
    };

    const openClientGuideDownload = (client) => {
      openClientGuideLink(client.downloadUrl);
    };

    const openDocumentation = () => {
      router.push('/docs');
    };

    const downloadClient = (platform) => {
      const downloadUrl = clientConfig.clientLinks[platform];
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    };

    const goToShop = () => {
      router.push('/shop');
    };

    const userPlanId = ref(null);

    const showResetTrafficModal = ref(false);
    const resetConfirmCooldown = ref(0);
    const resetConfirmTimer = ref(null);
    const isCreatingResetOrder = ref(false);

    const openResetTrafficModal = () => {
      showResetTrafficModal.value = true;
      resetConfirmCooldown.value = 3;
      resetConfirmTimer.value = setInterval(() => {
        if (resetConfirmCooldown.value > 0) {
          resetConfirmCooldown.value--;
        } else {
          clearInterval(resetConfirmTimer.value);
        }
      }, 1000);
    };
    const showPopup = ref(false);
    const popupConfig = reactive({

      title: t('invite.withdraw.tip'),

      content: t('dashboard.resetDataCycleNotice'),

      cooldownHours: 0,

      closeWaitSeconds: 0

    });
    const handlePopupClose = () => {

      showPopup.value = false;
      // console.log(showPopup.value,'111111111')
      // nextPeriod()

    };
    const handlePopupConfirm = async () => {
      try {
        const response = await setNextPeriod()
        console.log(response)
        if (response.data) {
          await fetchSubscribe()
          showToast(t('dashboard.nextPeriodSuccess'), 'success');
          showPopup.value = false;
        }
      } catch (error) {
        console.error('提前开启下月失败:', error);
        showToast(t('dashboard.nextPeriodError'), 'error');
      }

    }

    const closeResetTrafficModal = () => {
      showResetTrafficModal.value = false;
      if (resetConfirmTimer.value) {
        clearInterval(resetConfirmTimer.value);
      }
    };

    const createResetTrafficOrder = async () => {
      if (resetConfirmCooldown.value > 0) {
        return;
      }

      console.log('开始请求：设置 isCreatingResetOrder = true');
      isCreatingResetOrder.value = true;

      try {
        if (!userPlanId.value) {
          showToast(t('common.error_occurred'), 'error');
          console.log('无套餐ID：重置 isCreatingResetOrder = false');
          isCreatingResetOrder.value = false;
          return;
        }

        console.log('正在调用API，当前状态：', isCreatingResetOrder.value);
        const response = await submitOrder({
          plan_id: userPlanId.value,
          period: 'reset_price'
        });

        if (response && response.data) {
          console.log('API请求成功');
          showToast(t('dashboard.resetTrafficSuccess'), 'success');

          closeResetTrafficModal();

          router.push({
            path: '/payment',
            query: {
              trade_no: response.data
            }
          });
        }
      } catch (error) {
        console.error('创建重置流量订单失败:', error);
        showToast(error.message || t('common.error_occurred'), 'error');
      } finally {
        console.log('请求结束：重置 isCreatingResetOrder = false');
        isCreatingResetOrder.value = false;
      }
    };

    const fetchUserInfo = async () => {
      if (loading.userInfo === false && Object.keys(userPlan.value).length > 0) return;

      loading.userInfo = true;
      try {
        const response = await getUserInfo();
        if (response.data) {
          const info = response.data;

          userPlanId.value = info.plan_id;

          hasPlan.value = info.plan_id !== null && info.plan_id !== undefined;

          if (info.email) {
            userStats.userEmail = info.email;
          }
          if (info.balance !== undefined) {
            userBalance.value = info.balance;
            updateAccountBalanceDisplay();
          }
          if (info.expired_at) {
            userPlan.value.expireDate = formatDate(info.expired_at);
            userPlan.value.isExpireDatePermanent = false;

            const now = new Date();
            const expiredDate = new Date(info.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userPlan.value.expireDate = null;
            userPlan.value.isExpireDatePermanent = true;
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        loading.userInfo = false;
      }
    };

    const isExpiringSoon = computed(() => {
      if (userStats.isRemainingDaysPermanent) return false;

      const days = parseInt(userStats.remainingDays, 10);
      return !isNaN(days) && days > 0 && days <= DASHBOARD_CONFIG.expiringThreshold;
    });

    const hasIOSClients = computed(() => {
      return clientConfig.showShadowrocket ||
          clientConfig.showSurge ||
          clientConfig.showStash ||
          clientConfig.showQuantumultX ||
          clientConfig.showHiddifyIOS ||
          clientConfig.showSingboxIOS ||
          clientConfig.showLoon;
    });

    const hasAndroidClients = computed(() => {
      return clientConfig.showV2rayNG ||
          clientConfig.showClashAndroid ||
          clientConfig.showSurfboard ||
          clientConfig.showClashMetaAndroid ||
          clientConfig.showNekobox ||
          clientConfig.showSingboxAndroid ||
          clientConfig.showHiddifyAndroid;
    });

    const hasWindowsClients = computed(() => {
      return clientConfig.showClashWindows ||
          clientConfig.showFlClashWindows ||
          clientConfig.showClashVergeWindows ||
          clientConfig.showNekoray ||
          clientConfig.showSingboxWindows ||
          clientConfig.showHiddifyWindows;
    });

    const hasMacOSClients = computed(() => {
      return clientConfig.showClashX ||
          clientConfig.showFlClashMac ||
          clientConfig.showClashVergeMac ||
          clientConfig.showClashMetaX ||
          clientConfig.showSurgeMac ||
          clientConfig.showStashMac ||
          clientConfig.showQuantumultXMac ||
          clientConfig.showSingboxMac ||
          clientConfig.showHiddifyMac;
    });

    const isExpired = computed(() => {
      if (userStats.isRemainingDaysPermanent) return false;

      const days = parseInt(userStats.remainingDays, 10);
      return !isNaN(days) && days <= 0;
    });

    const isLowTraffic = computed(() => {
      return isTrafficBelowThreshold(
          userStats.remainingTraffic,
          userPlan.value?.totalTraffic,
          DASHBOARD_CONFIG.lowTrafficThreshold
      ) && !isTrafficDepleted.value;
    });

    const isTrafficDepleted = computed(() => isTrafficEmpty(userStats.remainingTraffic));

    const showResetTrafficButton = computed(() => {
      if (!DASHBOARD_CONFIG.enableResetTraffic) return false;

      switch (DASHBOARD_CONFIG.resetTrafficDisplayMode) {
        case 'always':
          return true;
        case 'low':
          return isLowTraffic.value || isTrafficDepleted.value;
        case 'depleted':
          return isTrafficDepleted.value;
        default:
          return false;
      }
    });

    const showRenewPlanButton = computed(() => {
      if (!DASHBOARD_CONFIG.enableRenewPlan) return false;


      switch (DASHBOARD_CONFIG.renewPlanDisplayMode) {
        case 'always':
          return true;
        case 'expiring':
          return isExpiringSoon.value;
        case 'expired':
          return isExpired.value;
        default:
          return false;
      }
    });


    const fetchSubscribe = async () => {
      // 如果showResetTrafficButton为true，强制执行（跳过缓存逻辑）
      // if (showResetTrafficButton.value) {
      //   // 强制执行，但仍要防止并发
      //   if (loading.subscribe === true) return;
      // } else {
      // 正常的缓存逻辑
      if (loading.subscribe === false && userPlan.value.subscribeUrl) return;
      // }

      loading.subscribe = true;
      try {
        const response = await getSubscribe();
        allowNewPeriod.value = response.data.allow_new_period;
        if (response.data) {
          const subscribe = response.data;
          if (subscribe.plan && subscribe.plan.name) {
            userPlan.value.name = subscribe.plan.name;
          }
          if (subscribe.plan && subscribe.plan.id) {
            userPlanId.value = subscribe.plan.id;
          }
          if (subscribe.expired_at) {
            userPlan.value.expireDate = formatDate(subscribe.expired_at);
            userPlan.value.isExpireDatePermanent = false;

            const now = new Date();
            const expiredDate = new Date(subscribe.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userPlan.value.expireDate = null;
            userPlan.value.isExpireDatePermanent = true;
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
          if (subscribe.transfer_enable) {
            userPlan.value.totalTraffic = formatTraffic(subscribe.transfer_enable);
          }
          if (subscribe.transfer_enable && subscribe.u !== undefined && subscribe.d !== undefined) {
            const usedTraffic = subscribe.u + subscribe.d;
            const remainingTraffic = Math.max(0, subscribe.transfer_enable - usedTraffic);
            userStats.remainingTraffic = formatTraffic(remainingTraffic);
          }
          if (subscribe.reset_day) {
            userPlan.value.resetDay = subscribe.reset_day;
          }
          if (subscribe.subscribe_url) {
            userPlan.value.subscribeUrl = subscribe.subscribe_url;
          }

          if (subscribe.device_limit !== undefined) {
            userPlan.value.deviceLimit = subscribe.device_limit;
          }
          if (subscribe.alive_ip !== undefined) {
            userPlan.value.aliveIp = subscribe.alive_ip;
          }

          if (subscribe.expired_at) {
            const now = new Date();
            const expiredDate = new Date(subscribe.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
        }
      } catch (error) {
        console.error('获取订阅信息失败:', error);
      } finally {
        loading.subscribe = false;
      }
    };

    const fetchNotices = async () => {
      if (loading.notices === false && notices.value.data && notices.value.data.length > 0) return;

      loading.notices = true;
      try {
        const response = await getNotices();
        if (response && response.data) {
          notices.value = response;

          checkForPopupNotices();
        }
      } catch (error) {
      } finally {
        loading.notices = false;
      }
    };

    const checkForPopupNotices = () => {
      if (!notices.value || !notices.value.data || notices.value.data.length === 0) return;

      const popupNoticeIndex = notices.value.data.findIndex(notice =>
          notice.tags && Array.isArray(notice.tags) && notice.tags.includes('\u5f39\u7a97')
      );

      if (popupNoticeIndex !== -1) {
        const noticeId = notices.value.data[popupNoticeIndex].id;
        const popupShownKey = `popup_notice_shown_${noticeId}`;

        if (!sessionStorage.getItem(popupShownKey)) {
          currentNoticeIndex.value = popupNoticeIndex;
          showNoticeDetails.value = true;
          sessionStorage.setItem(popupShownKey, 'true');
          nextTick(() => {
            updateModalHeight();
          });
        }
      }
    };

    const fetchUserStats = async () => {
      if (loading.userStats === false && userStats.remainingTraffic !== '0 GB') return;

      loading.userStats = true;
      try {
        const response = await getUserStats();
        if (response.data && Array.isArray(response.data) && response.data.length >= 2) {
          const stats = response.data;
          userStats.pendingOrders = stats[0];
          userStats.pendingTickets = stats[1];
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        loading.userStats = false;
      }
    };

    const formatTraffic = formatTrafficSize;

    const hasPendingItems = computed(() => {
      return userStats.pendingOrders > 0 || userStats.pendingTickets > 0;
    });

    const prevNotice = () => {
      if (currentNoticeIndex.value > 0) {
        currentNoticeIndex.value--;
      }
    };

    const nextNotice = () => {
      if (currentNoticeIndex.value < notices.value.data.length - 1) {
        currentNoticeIndex.value++;
      }
    };

    const showNoticeModal = () => {
      showNoticeDetails.value = true;
      nextTick(() => {
        updateModalHeight();
      });
    };

    const closeNoticeModal = () => {
      showNoticeDetails.value = false;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString * 1000);
      return date.toLocaleDateString();
    };

    const updateQRCodeUrl = async () => {
      if (userPlan.value.subscribeUrl) {
        qrCodeLoading.value = true;
        try {
          (await import('qrcode')).default.toDataURL(userPlan.value.subscribeUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          })
              .then(url => {
                qrCodeUrl.value = url;
                qrCodeLoading.value = false;
              })
              .catch(err => {
                console.error('二维码生成失败:', err);
                qrCodeLoading.value = false;
                showToast(t('dashboard.qrCodeGenerationFailed'), 'error', 3000);
              });
        } catch (error) {
          console.error('生成二维码失败:', error);
          qrCodeLoading.value = false;
          showToast(t('dashboard.qrCodeGenerationFailed'), 'error', 3000);
        }
      }
    };

    const qrCodeLoaded = () => {
      qrCodeLoading.value = false;
    };

    const copySubscription = () => {
      if (userPlan.value.subscribeUrl) {
        const copyWithAPI = () => {
          navigator.clipboard.writeText(userPlan.value.subscribeUrl)
              .then(() => {
                showToast(t('dashboard.subscriptionCopied'), 'success', 3000);
              })
              .catch(() => {
                showToast(t('dashboard.copyFailed'), 'error', 3000);
              });
        };

        const copyWithFallback = () => {
          try {
            const textarea = document.createElement('textarea');
            textarea.value = userPlan.value.subscribeUrl;
            textarea.style.position = 'fixed';
            textarea.style.left = '0';
            textarea.style.top = '0';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (successful) {
              showToast(t('dashboard.subscriptionCopied'), 'success', 3000);
            } else {
              showToast(t('dashboard.copyFailed'), 'error', 3000);
            }
          } catch (err) {
            console.error('使用后备方法复制失败:', err);
            showToast(t('dashboard.copyFailed'), 'error', 3000);
          }
        };

        if (navigator.clipboard) {
          copyWithAPI();
        } else {
          copyWithFallback();
        }
      }
    };

    const importToClient = (clientType) => {
      if (!userPlan.value.subscribeUrl) {
        showToast(t('dashboard.noSubscription'), 'error', 3000);
        return;
      }

      const subscribeUrl = userPlan.value.subscribeUrl;
      const siteName = SITE_CONFIG.siteName || '订阅';

      let url = '';
      let shouldUseCurrentWindow = true;

      try {
        switch (clientType) {
          case 'shadowrocket':
            url = `shadowrocket://add/sub://${window.btoa(subscribeUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}?remark=${encodeURIComponent(siteName)}`;
            break;
          case 'surge':
          case 'surge-mac':
            url = `surge:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'stash':
          case 'stash-mac':
            url = `stash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'quantumultx':
          case 'quantumultx-mac':
            url = `quantumult-x:///update-configuration?remote-resource=${encodeURI(JSON.stringify({server_remote: [`${subscribeUrl}, tag=${encodeURIComponent(siteName)}`,],}))}`;
            break;
          case 'loon':
            url = `loon://import?nodelist=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'v2rayng':
            url = `v2rayng://install-sub?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
            break;
          case 'clash':
          case 'clash-android':
          case 'clash-meta-android':
          case 'flclash':
          case 'clashverge':
          case 'nekobox':
          case 'nekoray':
          case 'clashx':
          case 'clashx-meta':
            url = `clash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'surfboard':
            url = `surfboard:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'singbox-ios':
          case 'singbox-android':
          case 'singbox-windows':
          case 'singbox-macos':
            url = `sing-box://import-remote-profile?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
            break;
          case 'hiddify-android':
          case 'hiddify-windows':
          case 'hiddify-macos':
          case 'hiddify-ios':
            url = `hiddify://import/${subscribeUrl}#${encodeURIComponent(siteName)}`;
            break;
          default:
            navigator.clipboard.writeText(subscribeUrl)
              .then(() => {
                showToast(t('dashboard.subscriptionCopied'), 'success', 3000);
              })
              .catch(() => {
                showToast(t('dashboard.copyFailed'), 'error', 3000);
              });
            return;
        }

        if (url) {
          if (shouldUseCurrentWindow) {
            window.location.href = url;
          } else {
            window.open(url, '_blank');
          }
        }
      } catch (error) {
        console.error('导入客户端失败:', error);
      }
    };

    const goToSupport = () => {
      if (window.innerWidth < 905) {
        router.push('/mobile/tickets');
      } else {
        router.push('/tickets');
      }
    };

    const toggleImportCard = () => {
      showImportCard.value = !showImportCard.value;
      if (showImportCard.value) {
        nextTick(() => {
          setTimeout(() => {
            const importCard = document.querySelector('.import-card');
            if (importCard) {
              importCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }, 260);
        });
      }
    };

    const fetchUserConfig = async () => {
      try {
        const response = await getUserConfig();
        if (response.data) {
          if (response.data.currency_symbol) {
            currencySymbol.value = response.data.currency_symbol;
            if (userStats.accountBalance) {
              updateAccountBalanceDisplay();
            }
          }
        }
      } catch (error) {
        console.error('获取用户配置失败:', error);
      }
    };

    const updateAccountBalanceDisplay = () => {
      if (userBalance.value) {
        userStats.accountBalance = `${currencySymbol.value}${(parseFloat(userBalance.value) / 100).toFixed(2)}`;
      }
    };

    onMounted(async () => {
      await fetchUserConfig();

      fetchUserInfo();

      fetchSubscribe();

      fetchNotices();

      fetchUserStats();

      updateQRCodeUrl();
    });

    watch(() => userPlan.value.subscribeUrl, () => {
      updateQRCodeUrl();
    });

    const processedNoticeContent = computed(() => {
      if (!notices.value?.data?.[currentNoticeIndex.value]?.content) {
        return '';
      }

      const content = notices.value.data[currentNoticeIndex.value].content;

      const hasHtml = /<[a-z][\s\S]*>/i.test(content);

      if (hasHtml) {
        let processedContent = content.replace(/\n/g, '<br>');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedContent;

        const buttons = tempDiv.querySelectorAll('button, a');
        buttons.forEach(button => {
          if (button.className && button.className.includes('eztheme-btn')) {
            button.classList.remove('markdown-link');
            button.style.textDecoration = 'none';
            button.style.borderBottom = 'none';
            button.setAttribute('data-no-markdown-style', 'true');
          }

          if (button.tagName.toLowerCase() === 'a') {
            const href = button.getAttribute('href');
            if (href && (href.includes('#eztheme-btn') || href.includes('?eztheme-btn') || href.includes('class=eztheme-btn'))) {
              button.href = href
                  .replace('#eztheme-btn', '')
                  .replace('?eztheme-btn', '')
                  .replace('class=eztheme-btn', '');
              button.classList.add('eztheme-btn');
              button.style.textDecoration = 'none';
              button.style.borderBottom = 'none';
              button.setAttribute('data-no-markdown-style', 'true');
            }
          }
        });

        return sanitizeHtml(tempDiv.innerHTML);
      } else {
        return sanitizeHtml(md.render(content));
      }
    });

    const windowWidth = ref(window.innerWidth);
    const windowHeight = ref(window.innerHeight);
    const noticeModalStyle = ref({});

    const updateModalHeight = () => {
      const isMobile = windowWidth.value <= 768;
      const availableHeight = windowHeight.value * (isMobile ? 0.75 : 0.8);

      noticeModalStyle.value = {
        maxHeight: `${availableHeight}px`
      };
    };

    const handleResize = () => {
      windowWidth.value = window.innerWidth;
      windowHeight.value = window.innerHeight;
      if (showNoticeDetails.value) {
        updateModalHeight();
      }
    };

    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
    });

    const renewPlan = () => {
      if (!userPlanId.value) {
        showToast(t('dashboard.noPlanToRenew'), 'error', 3000);
        return;
      }

      router.push(`/order-confirm?id=${userPlanId.value}`);
    };

    const isXiaoPanel = isXiaoV2board();

    const navigateToDeposit = () => {
      router.push('/wallet/deposit');
    };

    const showDeviceLimit = computed(() => {
      return isXiaoV2board() && DASHBOARD_CONFIG.showOnlineDevicesLimit;
    });

    const timers = {};
    const listeners = {};

    const startAutoRotateNotices = () => {
      if (!autoRotateNotices.value) return;

      createTimer(timers, 'noticeRotation', () => {
        if (notices.value && notices.value.data && notices.value.data.length > 1) {
          nextNotice();
        }
      }, 8000, true);
    };

    onActivated(() => {
      console.log('Dashboard组件被激活');
      if (needRefreshData.value) {
        fetchUserInfo();
        fetchUserStats();
        fetchNotices();
        needRefreshData.value = false;
      }

      startAutoRotateNotices();
    });

    onDeactivated(() => {
      console.log('Dashboard组件被停用');
      needRefreshData.value = true;

      cleanupResources(timers, listeners);
    });

    onUnmounted(() => {
      cleanupResources(timers, listeners);
    });

    const needRefreshData = ref(false);

    const trafficPercentage = computed(() => Math.round(calculateTrafficPercentage(
      userStats.remainingTraffic,
      userPlan.value?.totalTraffic
    )));

    return {
      userStats,
      userBalance,
      currencySymbol,
      userPlan,
      clientConfig,
      notices,
      loading,
      languageChangedSignal,
      goToShop,
      openDocumentation,
      downloadClient,
      hasPendingItems,
      router,
      currentNoticeIndex,
      prevNotice,
      nextNotice,
      showImportCard,
      showQrCode,
      importToClient,
      goToSupport,
      formatDate,
      formatTraffic,
      toggleImportCard,
      copySubscription,
      platforms,
      activePlatform,
      qrCodeUrl,
      qrCodeLoading,
      qrCodeLoaded,
      showNoticeModal,
      closeNoticeModal,
      showNoticeDetails,
      checkForPopupNotices,
      noticeModalStyle,
      noticeModalThemeClass,
      ipCardImageSrc,
      ipCardPopups,
      playIpCardEffect,
      openResetTrafficModal,
      popupConfig,
      handlePopupClose,
      handlePopupConfirm,
      showPopup,
      closeResetTrafficModal,
      createResetTrafficOrder,
      showResetTrafficModal,
      resetConfirmCooldown,
      showResetTrafficButton,
      isCreatingResetOrder,
      hasIOSClients,
      hasAndroidClients,
      hasWindowsClients,
      hasMacOSClients,
      shadowrocketIcon,
      surgeIcon,
      stashIcon,
      quantumultIcon,
      singboxIcon,
      loonIcon,
      v2rayNGIcon,
      clashAndroidIcon,
      surfboardIcon,
      clashMetaAndroidIcon,
      nekoboxIcon,
      singboxAndroidIcon,
      hiddifyAndroidIcon,
      flclashIcon,
      clashvergeIcon,
      clashWindowsIcon,
      nekorayIcon,
      singboxWindowsIcon,
      hiddifyWindowsIcon,
      clashXIcon,
      clashMetaXIcon,
      surgeMacIcon,
      stashMacIcon,
      quantumultXMacIcon,
      singboxMacIcon,
      hiddifyMacIcon,
      isExpiringSoon,
      isExpired,
      isLowTraffic,
      isTrafficDepleted,
      hasPlan,
      processedNoticeContent,
      showRenewPlanButton,
      renewPlan,
      isXiaoPanel,
      navigateToDeposit,
      showDeviceLimit,
      needRefreshData,
      trafficPercentage,
      waterAnimationState,
      DASHBOARD_CONFIG,
      allowNewPeriod,
      showImportSubscription,
      clientGuidePlatforms,
      activeClientGuidePlatform,
      clientGuideCards,
      openClientGuideDownload,
    };
  }
};
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  display: flex;
  justify-content: center;

  .dashboard-inner {
    width: 100%;
    max-width: 1200px;
  }

  .welcome-card {
    margin-bottom: 24px;

    .user-email {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid rgba(var(--theme-color-rgb), 0.1);
      color: var(--secondary-text-color);
      font-size: 14px;
    }
  }

  .dashboard-card {
    background-color: var(--card-background);
    border-radius: 30px;
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid var(--card-border-color);
    transition: border-color 0.3s ease, background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
    overflow: hidden;

    &.app-card--hoverable:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 42px rgba(var(--theme-color-rgb), 0.12);
      border-color: var(--card-hover-border-color);
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

      .card-actions {
        display: flex;
        gap: 10px;
      }
    }
  }

  .subscription-card {
    margin-bottom: 24px;

    .subscription-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
      padding: 4px;
      overflow: visible;

      .info-item {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
        padding: 16px 18px;
        border-radius: 22px;
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.1), rgba(var(--theme-color-rgb), 0.035));
        border: 1px solid rgba(var(--theme-color-rgb), 0.16);
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        overflow: hidden;

        .info-label {
          font-size: 13px;
          font-weight: 700;
          color: rgba(var(--text-color-rgb), 0.78);
          margin-bottom: 8px;
          line-height: 1.35;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }

        .info-value {
          min-width: 0;
          font-size: 20px;
          line-height: 1.32;
          font-weight: 800;
          color: var(--text-color);
          letter-spacing: 0.01em;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.28);
          word-break: break-word;
        }
      }
    }

    .subscription-actions {
      display: flex;
      gap: 12px;
      margin-top: 15px;

      @media (min-width: 769px) {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;

        button {
          flex: 0 0 auto;
          min-width: 120px;
        }
      }

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 10px;

        button {
          width: 100%;
        }
      }

      .reset-traffic-btn {
        position: relative;
        overflow: hidden;

        &.reset-warning {
          color: #ff9800;
          border-color: #ff9800;
          background-color: rgba(255, 152, 0, 0.1);
        }

        &.reset-danger {
          color: #f44336;
          border-color: #f44336;
          background-color: rgba(244, 67, 54, 0.1);
        }
      }

      .renew-plan-btn {
        position: relative;
        overflow: hidden;

        &.renew-warning {
          color: #ff9800;
          border-color: #ff9800;
          background-color: rgba(255, 152, 0, 0.1);
        }

        &.renew-danger {
          color: #f44336;
          border-color: #f44336;
          background-color: rgba(244, 67, 54, 0.1);
        }
      }
    }
  }

  :global(.dark-theme) .subscription-card {
    .subscription-info {
      .info-item {
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.18), rgba(255, 255, 255, 0.055));
        border-color: rgba(var(--theme-color-rgb), 0.28);
        box-shadow: 0 16px 34px rgba(0, 0, 0, 0.22);

        .info-label {
          color: rgba(255, 255, 255, 0.82);
        }

        .info-value {
          color: rgba(255, 255, 255, 0.98);
          text-shadow: 0 0 16px rgba(var(--theme-color-rgb), 0.18);
        }
      }
    }
  }

  .ip-check-card {
    position: relative;
    padding: 16px;
    margin-bottom: 18px;
    background:
      radial-gradient(circle at 12% 20%, rgba(var(--theme-color-rgb), 0.16), transparent 34%),
      radial-gradient(circle at 88% 24%, rgba(34, 211, 238, 0.14), transparent 32%),
      var(--card-background);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.18) 46%, transparent 68%);
      pointer-events: none;
    }

    .ip-check-header,
    .ip-check-body {
      position: relative;
      z-index: 1;
    }

    .ip-check-header {
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 10px;
    }

    .ip-check-subtitle {
      margin-top: 4px;
      color: var(--secondary-text-color);
      font-size: 12px;
      line-height: 1.45;
    }

    .ip-check-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex: 0 0 auto;
      padding: 6px 10px;
      border-radius: 999px;
      color: var(--theme-color);
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      background: rgba(var(--theme-color-rgb), 0.1);
      border: 1px solid rgba(var(--theme-color-rgb), 0.16);
      transition: transform 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        background: rgba(var(--theme-color-rgb), 0.16);
        border-color: rgba(var(--theme-color-rgb), 0.28);
      }
    }

    .ip-check-body {
      display: grid;
      grid-template-columns: minmax(240px, 340px) minmax(320px, 480px);
      align-items: center;
      justify-content: space-between;
      gap: 34px;
      padding: 0 36px;
    }

    .ip-check-copy {
      padding: 14px 16px;
      border-radius: 20px;
      background: rgba(var(--theme-color-rgb), 0.08);
      border: 1px solid rgba(var(--theme-color-rgb), 0.12);
    }

    .ip-check-title {
      color: var(--text-color);
      font-size: 16px;
      font-weight: 800;
      line-height: 1.35;
      margin-bottom: 6px;
    }

    .ip-check-desc {
      color: var(--secondary-text-color);
      font-size: 13px;
      line-height: 1.55;
    }

    .ip-card-display {
      position: relative;
      min-width: 0;
      margin: 0;
      border-radius: 18px;
      line-height: 0;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s ease, filter 0.3s ease;

      &:hover {
        transform: translateY(-2px) scale(1.01);
        filter: saturate(1.08);
      }
    }

    .ip-card-popup {
      position: absolute;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.86);
      border: 1px solid rgba(var(--theme-color-rgb), 0.16);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.16), 0 0 22px rgba(var(--theme-color-rgb), 0.22);
      font-size: 24px;
      line-height: 1;
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: ipCardPopup 0.95s cubic-bezier(0.22, 0.9, 0.32, 1) forwards;
      backdrop-filter: blur(10px);
    }

    .ip-card-image {
      display: block;
      width: 100%;
      max-width: 480px;
      margin: 0;
      border-radius: 18px;
    }
  }

  :global(.dark-theme) .ip-check-card {
    background:
      radial-gradient(circle at 12% 20%, rgba(var(--theme-color-rgb), 0.24), transparent 34%),
      radial-gradient(circle at 88% 24%, rgba(34, 211, 238, 0.16), transparent 32%),
      var(--card-background);

    .ip-check-copy {
      background: rgba(255, 255, 255, 0.055);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .ip-card-popup {
      background: rgba(15, 23, 42, 0.82);
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28), 0 0 24px rgba(var(--theme-color-rgb), 0.2);
    }
  }

  @media (max-width: 768px) {
    .ip-check-card {
      .ip-check-header {
        flex-direction: column;
      }

      .ip-check-action {
        width: 100%;
        justify-content: center;
      }

      .ip-check-body {
        grid-template-columns: 1fr;
        padding: 0;
      }

      .ip-card-image {
        max-width: 100%;
        margin: 0 auto;
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr));
    }

    @media (min-width: 1200px) {
      grid-template-columns: repeat(4, 1fr);
    }

    .stats-card {
      position: relative;
      background-color: var(--card-background);
      border-radius: 30px;
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px;
      transition: transform 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
      overflow: hidden;
      border: 1px solid var(--card-border-color);

      .water-container {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: inherit;
        pointer-events: none;
      }

      .water-progress {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        background-color: rgba(var(--theme-color-rgb), 0.12);
        transition: none;
        border-radius: 0 0 30px 30px;
        height: 0;

        &.animate-water {
          transition: height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        &:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
        }
      }

      .stats-icon, .stats-info {
        position: relative;
        z-index: 1;
      }

      &.warning-card .water-progress {
        background-color: rgba(255, 152, 0, 0.15);
      }

      &.danger-card .water-progress {
        background-color: rgba(244, 67, 54, 0.15);
      }

      @keyframes wave {
        0% {
          transform: translateX(0) translateZ(0);
        }
        100% {
          transform: translateX(-50%) translateZ(0);
        }
      }

      &:hover {
        border-color: var(--card-hover-border-color);
        box-shadow: 0 18px 42px rgba(var(--theme-color-rgb), 0.12);
      }

      &.app-card--hoverable:hover {
        transform: translateY(-2px);
      }

      .stats-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        background-color: rgba(var(--theme-color-rgb), 0.1);
        border-radius: 22px;
        margin-right: 15px;
        color: var(--theme-color);
      }

      .stats-info {
        flex: 1;

        .stats-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-color);
          margin-bottom: 5px;
        }

        .stats-label {
          font-size: 14px;
          color: var(--secondary-text-color);
        }
      }

      .chevron-icon {
        color: var(--theme-color);
        opacity: 0.5;
        transition: all 0.3s ease;
      }

      &:hover {
        .chevron-icon {
          transform: translateX(3px);
          opacity: 1;
        }
      }
    }
  }


  .download-card {
    .download-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;

      @media (max-width: 576px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .download-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        padding: 15px;
        border-radius: 10px;
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);

        &:hover {
          background-color: rgba(var(--theme-color-rgb), 0.05);
          transform: translateY(-2px);
        }

        .option-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          margin-bottom: 12px;

          &.ios {
            background-color: rgba(0, 122, 255, 0.1);
            color: #007aff;
          }

          &.android {
            background-color: rgba(61, 178, 74, 0.1);
            color: #3db24a;
          }

          &.macos {
            background-color: rgba(90, 90, 90, 0.1);
            color: #5a5a5a;
          }

          &.windows {
            background-color: rgba(0, 120, 215, 0.1);
            color: #0078d7;
          }

          &.linux {
            background-color: rgba(243, 123, 29, 0.1);
            color: #f37b1d;
          }

          &.openwrt {
            background-color: rgba(0, 136, 204, 0.1);
            color: #0088cc;
          }
        }

        .option-name {
          font-size: 14px;
          font-weight: 500;
        }
      }
    }
  }


  .client-guide-section {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .client-guide-tabs {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 4px;
    border-radius: 24px;
    background-color: rgba(var(--theme-color-rgb), 0.04);
    border: 1px solid rgba(var(--theme-color-rgb), 0.08);
  }

  .client-guide-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 20px;
    background: transparent;
    color: var(--secondary-text-color);
    font-weight: 600;
    cursor: pointer;
    transition: color 0.28s ease, background-color 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease;
    white-space: nowrap;
  }

  .client-guide-tab svg {
    transition: transform 0.28s ease, opacity 0.28s ease;
  }

  .client-guide-tab.active {
    background: var(--card-background);
    border-color: var(--card-border-color);
    color: var(--theme-color);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  }

  .client-guide-tab.active svg {
    transform: scale(1.08);
  }

  @media (max-width: 576px) {
    .client-guide-section {
      gap: 14px;
    }

    .client-guide-tabs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 4px;
      border-radius: 22px;
    }

    .client-guide-tab {
      width: 100%;
      min-height: 42px;
      border-radius: 18px;
      font-size: 13px;
    }

    .client-guide-tab.active {
      border-color: var(--card-border-color);
      background-color: var(--card-background);
    }
  }

  .client-guide-tab:hover {
    background-color: rgba(var(--theme-color-rgb), 0.1);
    color: var(--text-color);
    transform: translateY(-1px);
  }

  .client-download-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
    width: 100%;
  }

  .client-list-switch-enter-active,
  .client-list-switch-leave-active {
    transition: opacity 0.24s ease, transform 0.24s ease, filter 0.24s ease;
    will-change: opacity, transform, filter;
  }

  .client-list-switch-enter-from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
    filter: blur(4px);
  }

  .client-list-switch-leave-to {
    opacity: 0;
    transform: translateY(-8px) scale(0.985);
    filter: blur(4px);
  }

  .client-list-switch-enter-active .client-download-item {
    animation: clientDownloadItemIn 0.28s ease both;
  }

  .client-list-switch-enter-active .client-download-item:nth-child(2) {
    animation-delay: 0.04s;
  }

  .client-list-switch-enter-active .client-download-item:nth-child(3) {
    animation-delay: 0.08s;
  }

  .client-list-switch-enter-active .client-download-item:nth-child(4) {
    animation-delay: 0.12s;
  }

  @keyframes clientDownloadItemIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .client-download-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 72px;
    padding: 12px 14px;
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.5);
    color: var(--text-color);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
    cursor: pointer;
    transition: border-color 0.28s ease, background-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease;
  }

  .client-download-item:hover {
    border-color: rgba(148, 163, 184, 0.34);
    background-color: rgba(255, 255, 255, 0.62);
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
    transform: translateY(-1px);
  }

  .client-download-info,
  .client-download-action {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .client-download-info {
    min-width: 0;
    flex: 1;
  }

  .client-download-name {
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    line-height: 1.35;
    word-break: normal;
  }

  .client-download-action {
    position: relative;
    isolation: isolate;
    flex-shrink: 0;
    min-height: 38px;
    min-width: 112px;
    justify-content: center;
    padding: 0 14px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.26);
    color: var(--text-color);
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.36);
    backdrop-filter: blur(16px) saturate(1.05);
    -webkit-backdrop-filter: blur(16px) saturate(1.05);
    overflow: hidden;
    transition: color 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease, background-color 0.28s ease;
  }

  .client-download-action::before {
    content: '';
    position: absolute;
    inset: 1px;
    z-index: -1;
    border-radius: inherit;
    background: rgba(255, 255, 255, 0.2);
    box-shadow: inset 18px 18px 32px rgba(255, 255, 255, 0.18), inset -14px -14px 28px rgba(15, 23, 42, 0.06);
    pointer-events: none;
  }

  .client-download-action::after {
    content: '';
    position: absolute;
    z-index: -1;
    width: 46px;
    height: 46px;
    right: -18px;
    bottom: -20px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.28);
    filter: blur(10px);
    pointer-events: none;
  }

  .client-download-item:hover .client-download-action {
    border-color: rgba(255, 255, 255, 0.56);
    color: var(--text-color);
    background: rgba(255, 255, 255, 0.24);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.44);
    transform: translateY(-1px);
  }

  .client-download-item:active .client-download-action {
    transform: translateY(0);
  }

  .client-guide-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.16), rgba(var(--theme-color-rgb), 0.05));
    border: 1px solid rgba(var(--theme-color-rgb), 0.12);
    overflow: hidden;
  }

  .client-guide-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
    border-radius: 12px;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.12));
  }

  .client-guide-icon-fallback {
    color: var(--theme-color);
  }

  @media (max-width: 576px) {
    .client-download-list {
      grid-template-columns: 1fr;
    }

    .client-download-item {
      min-height: 66px;
      padding: 10px;
    }

    .client-download-action {
      min-width: auto;
      padding: 0 10px;
    }
  }

  .notice-card {
    margin-bottom: 24px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .notice-counter {
        font-size: 14px;
        color: var(--secondary-text-color);
      }
    }

    .notice-item {
      position: relative;
      padding: 16px;
      border-radius: 22px;
      background-color: rgba(var(--theme-color-rgb), 0.05);
      overflow: hidden;

      .notice-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-color);
      }

      .notice-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;

        .notice-date {
          font-size: 12px;
          color: var(--secondary-text-color);
          opacity: 0.7;
        }

        .notice-nav {
          display: flex;
          gap: 8px;

          .btn-notice {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 6px 10px;
            border-radius: 18px;
            font-size: 13px;
            background-color: rgba(var(--theme-color-rgb), 0.1);
            color: var(--theme-color);
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
              background-color: rgba(var(--theme-color-rgb), 0.2);
              transform: translateY(-1px);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }

        @media (max-width: 576px) {
          flex-direction: column;
          align-items: flex-start;

          .notice-nav {
            width: 100%;

            .btn-notice {
              flex: 1;
              justify-content: center;
              padding: 8px;
            }
          }
        }

        @media (max-width: 470px) {
          .notice-nav {
            display: grid;
            grid-template-rows: auto auto;
            gap: 8px;
            width: 100%;

            .btn-notice:nth-child(2) {
              grid-row: 1;
              grid-column: 1 / span 2;
            }

            .btn-notice:nth-child(1),
            .btn-notice:nth-child(3) {
              grid-row: 2;
            }

            .btn-notice:nth-child(1) {
              grid-column: 1;
            }

            .btn-notice:nth-child(3) {
              grid-column: 2;
            }

            .btn-notice {
              margin: 0;
              width: 100%;
            }
          }
        }
      }
    }
  }


  .pending-items-card {
    margin-bottom: 24px;

    .pending-items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pending-item {
      display: flex;
      align-items: center;
      padding: 15px;
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.1), rgba(var(--card-background-rgb), 0.2));
      border: 1px solid rgba(var(--theme-color-rgb), 0.18);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 28px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(24px) saturate(155%);
      -webkit-backdrop-filter: blur(24px) saturate(155%);
      cursor: pointer;
      transition: all 0.3s ease;
      overflow: hidden;

      &:hover {
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.14), rgba(var(--card-background-rgb), 0.28));
        border-color: rgba(var(--theme-color-rgb), 0.28);
      }

      .pending-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 18px;
        background-color: rgba(var(--theme-color-rgb), 0.15);
        color: var(--theme-color);
        margin-right: 15px;
      }

      .pending-info {
        flex: 1;
        font-weight: 500;
      }

      .pending-action {
        color: var(--secondary-text-color);
        transition: transform 0.3s ease;
      }

      &:hover .pending-action {
        transform: translateX(3px);
        color: var(--theme-color);
      }
    }
  }
}


.skeleton-loading {
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
    z-index: 1;
  }
}

@keyframes ipCardPopup {
  0% {
    opacity: 0;
    transform: translate(-50%, -36%) scale(0.72) rotate(-8deg);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -56%) scale(1.08) rotate(4deg);
  }
  68% {
    opacity: 1;
    transform: translate(-50%, -98%) scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -142%) scale(0.92) rotate(8deg);
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}


.btn-primary, .btn-outline, .btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.28s ease, background-color 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease;

  .btn-icon {
    margin-right: 2px;
    transition: color 0.28s ease, opacity 0.28s ease, transform 0.28s ease;
  }
}

.btn-primary {
  background-color: var(--theme-color);
  color: white;
  border: none;

  &:hover {
    background-color: var(--primary-color-hover);
    transform: translateY(-1px);
  }
}

.btn-outline {
  background-color: rgba(var(--theme-color-rgb), 0.045);
  color: var(--text-color);
  border: 1px solid var(--card-border-color, var(--border-color));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);

  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.36);
    color: var(--theme-color);
    background-color: rgba(var(--theme-color-rgb), 0.09);
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(var(--theme-color-rgb), 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  &.btn-active {
    color: var(--theme-color);
    border-color: rgba(var(--theme-color-rgb), 0.5);
    background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.18), rgba(var(--theme-color-rgb), 0.08));
    box-shadow: 0 10px 26px rgba(var(--theme-color-rgb), 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  &.btn-active .btn-icon {
    transform: scale(1.06);
    opacity: 1;
  }

  &.import-subscription-btn {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    transform-origin: center;
  }

  &.import-subscription-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.16), transparent 38%), linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.16), rgba(var(--theme-color-rgb), 0.04));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &.import-subscription-btn::after {
    content: '';
    position: absolute;
    top: -60%;
    bottom: -60%;
    left: -42%;
    width: 34%;
    z-index: -1;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.24), transparent);
    transform: translateX(-160%) rotate(18deg);
    transition: transform 0.45s ease;
  }

  &.import-subscription-btn:hover {
    transform: translateY(-2px) scale(1.015);
  }

  &.import-subscription-btn:hover::before,
  &.import-subscription-btn.btn-active::before {
    opacity: 1;
  }

  &.import-subscription-btn:hover::after,
  &.import-subscription-btn.btn-active::after {
    transform: translateX(430%) rotate(18deg);
  }

  &.import-subscription-btn.btn-active {
    transform: translateY(1px) scale(0.99);
    border-color: rgba(var(--theme-color-rgb), 0.62);
    background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.26), rgba(var(--theme-color-rgb), 0.1));
    box-shadow: 0 8px 24px rgba(var(--theme-color-rgb), 0.18), inset 0 2px 8px rgba(var(--theme-color-rgb), 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  &.import-subscription-btn.btn-active .btn-icon {
    transform: rotate(90deg) scale(1.08);
  }


  &.btn-highlight-btnbgcolor {
    position: relative;
    overflow: hidden;
    background-color: var(--theme-color);
    color: white;
    border-color: var(--theme-color);

    &:hover {
      background-color: var(--primary-color-hover, var(--theme-color));
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(var(--theme-color-rgb), 0.25);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.2) 50%,
              rgba(255, 255, 255, 0) 100%
      );
      animation: card-shimmer 3s infinite;
      transform: skewX(-25deg);
    }
  }
}

@keyframes card-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

.btn-action {
  background-color: transparent;
  color: var(--secondary-text-color);
  border: none;
  padding: 5px 10px;
  font-size: 13px;

  &:hover {
    color: var(--theme-color);
    background-color: rgba(var(--theme-color-rgb), 0.05);
  }

  .action-icon {
    width: 16px;
    height: 16px;
  }
}


.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}


@media (max-width: 768px) {
  .dashboard-container {
    padding: 15px;
    padding-bottom: 80px;
  }

  :global(.dark-theme) .subscription-card {
    .subscription-info {
      .info-item {
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.18), rgba(255, 255, 255, 0.055));
        border-color: rgba(var(--theme-color-rgb), 0.28);
        box-shadow: 0 16px 34px rgba(0, 0, 0, 0.22);

        .info-label {
          color: rgba(255, 255, 255, 0.82);
        }

        .info-value {
          color: rgba(255, 255, 255, 0.98);
          text-shadow: 0 0 16px rgba(var(--theme-color-rgb), 0.18);
        }
      }
    }
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .subscription-card .subscription-info {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 2px;
  }

  .subscription-card .info-item {
    width: 100%;
    padding: 14px 16px;
    border-right: none;
    border-bottom: none;
  }

  .subscription-card .info-item:last-child {
    border-bottom: none;
  }

  .subscription-actions {
    flex-direction: column;
    margin-top: 15px;
  }

  .platform-selector {
    flex-wrap: wrap;
  }

  .no-plan-content {
    flex-direction: column;
    text-align: center;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .no-plan-icon {
    width: 65px;
    height: 65px;
    margin: 0 auto;
    transform: rotate(0deg);
  }

  .no-plan-icon .icon-cart {
    width: 36px;
    height: 36px;
  }

  .no-plan-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;
  }

  .no-plan-title {
    font-size: 1.1rem;
    margin-bottom: 12px;
    text-align: center;
  }

  .no-plan-actions {
    justify-content: center;
    width: 100%;
    gap: 10px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .no-plan-actions .action-button {
    padding: 8px 15px;
    min-width: 120px;
    justify-content: center;
  }

  .no-plan-actions .action-button span {
    font-size: 14px;
  }

  .no-plan-actions .action-button .btn-icon {
    width: 16px;
    height: 16px;
  }

  .stats-card.no-plan-card {
    padding: 15px 12px;
  }
}

@media (min-width: 769px) {
  .subscription-actions {
    display: flex;
    flex-direction: row;
    gap: 12px;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}


.dashboard-card.doc-card {
  cursor: pointer;

  .doc-card-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .doc-card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    border-radius: 12px;
    background-color: rgba(92, 124, 250, 0.15);
    color: #5c7cfa;
  }

  .doc-card-info {
    flex: 1;
    min-width: 0;
  }

  .doc-card-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--theme-color);
    margin-bottom: 6px;
  }

  .doc-card-desc {
    font-size: 14px;
    line-height: 1.5;
    color: var(--secondary-text-color);
  }

  .chevron-icon {
    color: var(--theme-color);
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.08);
    transform: translateY(-3px);

    .chevron-icon {
      transform: translateX(3px);
      opacity: 1;
    }
  }
}

.stats-card.doc-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stats-card.doc-card:hover {
  background-color: rgba(var(--theme-color-rgb), 0.08);
  transform: translateY(-3px);
}

.stats-card.doc-card .stats-icon {
  background-color: rgba(92, 124, 250, 0.15);
  color: #5c7cfa;
}

.stats-card.doc-card .stats-value {
  color: var(--theme-color);
}

.stats-card.doc-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.2) 50%,
          rgba(255, 255, 255, 0) 100%
  );
  animation: card-shimmer 3s infinite;
  transform: skewX(-25deg);
}

@keyframes card-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}


.import-card-shell {
  display: grid;
  grid-template-rows: 1fr;
  margin-bottom: 24px;
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
  transform-origin: top center;
  will-change: grid-template-rows, opacity, transform, filter;
}

.import-card {
  min-height: 0;
  overflow: hidden;
  will-change: transform, opacity;
  transform-origin: top center;
}

.import-card-transition-enter-active {
  transition: grid-template-rows 0.36s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease, transform 0.36s cubic-bezier(0.22, 1, 0.36, 1), filter 0.32s ease;
}

.import-card-transition-leave-active {
  transition: grid-template-rows 0.26s ease, opacity 0.22s ease, transform 0.26s ease, filter 0.22s ease;
}

.import-card-transition-enter-from,
.import-card-transition-leave-to {
  grid-template-rows: 0fr;
  margin-bottom: 0;
  opacity: 0;
  transform: translateY(-14px) scale(0.985);
  filter: blur(4px);
}

.import-card-transition-enter-active .import-card,
.import-card-transition-leave-active .import-card {
  pointer-events: none;
}

.import-card-transition-enter-from .import-card,
.import-card-transition-leave-to .import-card {
  opacity: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: transparent;
  border: none;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.1);
    transform: rotate(90deg);

    .close-icon::before,
    .close-icon::after {
      background-color: var(--theme-color);
    }
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.2);
  }

  .close-icon {
    position: relative;
    width: 20px;
    height: 20px;

    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      background-color: var(--secondary-text-color);
      border-radius: 2px;
      top: 50%;
      left: 0;
      transition: background-color 0.2s ease;
    }

    &::before {
      transform: translateY(-50%) rotate(45deg);
    }

    &::after {
      transform: translateY(-50%) rotate(-45deg);
    }
  }
}

.import-action {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 10px;
  cursor: pointer;
  background-color: rgba(var(--theme-color-rgb), 0.05);
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.1);
    transform: translateY(-2px);
  }

  .import-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 10px;
    margin-right: 16px;
    background-color: rgba(var(--theme-color-rgb), 0.1);
    color: var(--theme-color);
  }

  .import-content {
    flex: 1;

    .import-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .import-desc {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
  }
}

.copy-action .import-icon {
  background-color: rgba(25, 113, 194, 0.1);
  color: #1971c2;
}

.qrcode-action .import-icon {
  background-color: rgba(64, 192, 87, 0.1);
  color: #40c057;
}

.platform-section {
  margin-bottom: 24px;

  .platform-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(var(--theme-color-rgb), 0.1);
  }

  .platform-options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;

    .platform-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      border-radius: 10px;
      background-color: rgba(var(--theme-color-rgb), 0.05);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(var(--theme-color-rgb), 0.1);
        transform: translateY(-3px);
        border-color: var(--theme-color);
      }

      svg {
        margin-bottom: 8px;
        color: var(--theme-color);
      }

      span {
        font-size: 14px;
      }
    }
  }
}
.platform-section-transition-enter-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), filter 0.28s ease;
}

.platform-section-transition-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease, filter 0.18s ease;
}

.platform-section-transition-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.99);
  filter: blur(3px);
}

.platform-section-transition-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
  filter: blur(3px);
}

.import-card-transition-enter-active .import-action,
.import-card-transition-enter-active .platform-selector,
.import-card-transition-enter-active .platform-section {
  animation: import-content-rise 0.34s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.import-card-transition-enter-active .qrcode-action {
  animation-delay: 0.04s;
}

.import-card-transition-enter-active .platform-selector {
  animation-delay: 0.08s;
}

.import-card-transition-enter-active .platform-section {
  animation-delay: 0.12s;
}

.platform-section-transition-enter-active .platform-option {
  animation: platform-option-rise 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.platform-section-transition-enter-active .platform-option:nth-child(2) {
  animation-delay: 0.025s;
}

.platform-section-transition-enter-active .platform-option:nth-child(3) {
  animation-delay: 0.05s;
}

.platform-section-transition-enter-active .platform-option:nth-child(4) {
  animation-delay: 0.075s;
}

.platform-section-transition-enter-active .platform-option:nth-child(5) {
  animation-delay: 0.1s;
}

.platform-section-transition-enter-active .platform-option:nth-child(6) {
  animation-delay: 0.125s;
}

.platform-section-transition-enter-active .platform-option:nth-child(7) {
  animation-delay: 0.15s;
}

@keyframes import-content-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes platform-option-rise {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.qrcode-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.qrcode-modal {
  background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  width: 90%;
  max-width: 360px;
  overflow: hidden;
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (prefers-color-scheme: dark) {
    background-color: rgba(var(--card-background-rgb, 30, 30, 30), 1);
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.qrcode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(var(--theme-color-rgb), 0.03);

  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--text-color);
    font-weight: 600;
  }
}

.qrcode-content {
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, rgba(var(--theme-color-rgb), 0.02), transparent);

  img {
    width: 220px;
    height: 220px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    background-color: white;
    padding: 15px;
    object-fit: cover;
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    }
  }

  .qrcode-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 25px;
    min-height: 220px;

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(var(--theme-color-rgb), 0.2);
      border-radius: 50%;
      border-top-color: var(--theme-color);
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 15px;
    }

    p {
      font-size: 15px;
      color: var(--secondary-text-color);
      font-weight: 500;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .platform-options {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .import-action {
    padding: 12px;

    .import-icon {
      width: 40px;
      height: 40px;
    }
  }
}


.platform-selector {
  display: flex;
  gap: 10px;
  width: fit-content;
  max-width: calc(100% - 32px);
  margin: 0 auto 20px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 8px 14px;
  border: 1px solid var(--card-border-color, var(--border-color));
  border-radius: 999px;
  background-color: rgba(var(--theme-color-rgb), 0.035);

  .platform-button {
    display: flex;
    align-items: center;
    gap: 7px;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.28s ease, background-color 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease;
    color: var(--secondary-text-color);

    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.08);
      transform: translateY(-1px);
      border-color: rgba(var(--theme-color-rgb), 0.2);
      color: var(--text-color);
    }

    &.active {
      background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.2), rgba(var(--theme-color-rgb), 0.1));
      color: var(--theme-color);
      border-color: rgba(var(--theme-color-rgb), 0.42);
      box-shadow: 0 8px 24px rgba(var(--theme-color-rgb), 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.12);
    }

    svg {
      color: currentColor;
      opacity: 0.82;
      transition: color 0.28s ease, opacity 0.28s ease, transform 0.28s ease;
    }

    &.active svg {
      opacity: 1;
      transform: scale(1.08);
    }
  }
}


.client-icon {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  margin-bottom: 8px;
  object-fit: cover;
}

.platform-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 10px;
  background-color: rgba(var(--theme-color-rgb), 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    margin-bottom: 8px;
    color: var(--theme-color);
  }

  span {
    font-size: 14px;
  }
}


.stats-card.warning-card {
  border-color: #ff9800;
  box-shadow: none;

  .stats-icon {
    background-color: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }

  .stats-value {
    color: #ff9800;
  }
}

.stats-card.danger-card {
  border-color: #f44336;
  box-shadow: none;

  .stats-icon {
    background-color: rgba(244, 67, 54, 0.1);
    color: #f44336;
  }

  .stats-value {
    color: #f44336;
  }
}




.skeleton-card {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
    z-index: 1;
  }
}


.skeleton-header {
  height: 24px;
  margin-bottom: 20px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 6px;
  width: 30%;
  margin: 16px 20px;
  position: relative;
}

.skeleton-body {
  padding: 0 20px 20px;
}

.skeleton-row {
  height: 16px;
  margin-bottom: 16px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 100%;
  position: relative;
}

.skeleton-row:last-child {
  width: 75%;
  margin-bottom: 0;
}


.dark-theme .skeleton-header,
.dark-theme .skeleton-row,
.dark-theme .skeleton-circle,
.dark-theme .skeleton-row-sm,
.dark-theme .skeleton-row-xs {
  background-color: rgba(255, 255, 255, 0.08);
}


.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  margin-right: 16px;
  flex-shrink: 0;
  position: relative;
}

.skeleton-content {
  flex: 1;
  position: relative;
}

.skeleton-row-sm {
  height: 16px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 80%;
  margin-bottom: 10px;
  position: relative;
}

.skeleton-row-xs {
  height: 12px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 50%;
  position: relative;
}


.stats-card.skeleton-card {
  display: flex;
  align-items: center;
  padding: 16px;
  animation: none;
  background-color: var(--card-background);
  box-shadow: none;
  border: 1px solid var(--card-border-color);
  position: relative;
}

.stats-card.skeleton-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0,
          rgba(255, 255, 255, 0.2) 20%,
          rgba(255, 255, 255, 0.5) 60%,
          rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 2s infinite;
  z-index: 1;
}

.import-action .import-content .import-desc {
  color: var(--secondary-text-color);
  font-size: 12px;
  line-height: 1.4;
}

.no-clients-message {
  padding: 20px;
  text-align: center;
  background-color: rgba(var(--theme-color-rgb), 0.05);
  border-radius: 12px;
  margin: 10px 0;
  border: 1px dashed rgba(var(--theme-color-rgb), 0.3);
}

.no-clients-message p {
  color: var(--text-color);
  font-size: 14px;
  margin: 0;
}


.platform-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;

  .platform-button {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: rgba(var(--theme-color-rgb), 0.05);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--text-color);

    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.1);
      transform: translateY(-1px);
      border-color: rgba(var(--theme-color-rgb), 0.2);
    }

    &.active {
      background-color: rgba(var(--theme-color-rgb), 0.15);
      color: var(--theme-color);
      border-color: var(--theme-color);
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(var(--theme-color-rgb), 0.2);
    }

    svg {
      color: var(--theme-color);
      opacity: 0.8;
    }
  }
}


@media (min-width: 1200px) {
  .stats-card.no-plan-card {
    padding: 25px 30px;
  }

  .no-plan-content {
    gap: 30px;
  }

  .no-plan-title {
    font-size: 1.3rem;
  }

  .no-plan-actions .action-button {
    padding: 12px 22px;
    font-size: 16px;
  }
}


.no-plan-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.no-plan-actions .action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}


@media screen and (min-width: 769px) {
  .no-plan-content {
    display: flex;
    align-items: center;
    gap: 24px;
    position: relative;
    z-index: 1;
    flex-direction: row;
  }

  .no-plan-message {
    flex: 1;
    text-align: left;
    align-items: flex-start;
    width: auto;
  }

  .no-plan-title {
    text-align: left;
    width: auto;
  }

  .no-plan-actions {
    justify-content: flex-start;
    width: auto;
    flex-direction: row;
  }

  .no-plan-actions .action-button {
    width: auto;
    max-width: none;
  }
}


.notice-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  backdrop-filter: blur(4px);
}

.notice-modal {
  width: min(92vw, 760px);
  max-width: 760px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.notice-modal.notice-modal--dark {
  background: #1f2937;
}

.notice-modal.notice-modal--dark .notice-modal-header,
.notice-modal.notice-modal--dark .notice-modal-content,
.notice-modal.notice-modal--dark .notice-modal-footer {
  background: #1f2937;
}

.notice-modal.notice-modal--dark .popup-title,
.notice-modal.notice-modal--dark .notice-content,
.notice-modal.notice-modal--dark .notice-content :deep(p),
.notice-modal.notice-modal--dark .notice-content :deep(li) {
  color: #ffffff;
}

.notice-modal-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background: #ffffff;

  .popup-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
  }

  .popup-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--secondary-text-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    margin: -8px;
    border-radius: 50%;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.12);
      color: var(--text-color);
      transform: rotate(90deg);
    }
  }
}

.notice-modal-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: #ffffff;

  .notice-content {
    font-size: 14px;
    line-height: 1.6;

    :deep(p) {
      margin: 12px 0;
      line-height: 1.6;
      color: var(--text-color);
    }

    :deep(strong) {
      color: var(--theme-color);
      font-weight: 600;
    }

    :deep(a) {
      color: var(--theme-color);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      margin: 10px 0;
      border-radius: 8px;
    }

    :deep(ul), :deep(ol) {
      padding-left: 20px;
      margin-bottom: 16px;

      li {
        margin-bottom: 8px;
        list-style-position: outside;
      }
    }

    :deep(ul) li {
      list-style-type: disc;
    }

    :deep(ol) li {
      list-style-type: decimal;
    }

    :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }

    :deep(blockquote) {
      border-left: 4px solid var(--theme-color);
      padding: 10px 15px;
      margin: 16px 0;
      background-color: rgba(var(--theme-color-rgb), 0.05);
      border-radius: 0 6px 6px 0;

      p {
        margin: 8px 0;
      }
    }

    :deep(code) {
      font-family: monospace;
      background-color: rgba(var(--theme-color-rgb), 0.1);
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    :deep(pre) {
      background-color: rgba(var(--theme-color-rgb), 0.05);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 16px 0;

      code {
        background-color: transparent;
        padding: 0;
      }
    }

    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;

      th, td {
        border: 1px solid var(--border-color);
        padding: 8px 12px;
        text-align: left;
      }

      th {
        background-color: rgba(var(--theme-color-rgb), 0.05);
        font-weight: 600;
      }

      tr:nth-child(even) {
        background-color: rgba(var(--theme-color-rgb), 0.02);
      }
    }

    :deep(a.eztheme-btn) {
      display: inline-block;
      padding: 8px 16px;
      background-color: var(--theme-color);
      color: white;
      border-radius: 8px;
      margin: 10px 0;
      text-decoration: none;
      transition: all 0.3s ease;

      &:hover {
        background-color: var(--primary-color-hover);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(var(--theme-color-rgb), 0.3);
      }
    }
  }
}

.notice-modal-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  background: #ffffff;

  .popup-action-btn {
    padding: 8px 20px;
    background-color: var(--theme-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;

    &.adaptive-btn {
      min-width: auto;
      padding: 8px 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(var(--theme-color-rgb), 0.3);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      background-color: var(--secondary-text-color);
    }
  }
}

.popup-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.popup-slide-leave-active {
  transition: all 0.2s ease-out;
}

.popup-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.popup-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}


@media (max-width: 768px) {
  .notice-modal-overlay {
    padding: 15px;

    .notice-modal {
      max-width: 100%;
      max-height: 85vh;

      .notice-modal-header {
        padding: 15px;

        .popup-title {
          font-size: 16px;
        }
      }

      .notice-modal-content {
        padding: 15px;
      }

      .notice-modal-footer {
        padding: 12px 15px;
      }
    }
  }
}


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-card {
  background-color: var(--card-background);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reset-traffic-modal {
  .modal-header {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color);
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      color: var(--secondary-text-color);
      cursor: pointer;
      padding: 0;

      &:hover {
        color: var(--text-color);
      }
    }
  }

  .modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .warning-icon {
      margin-bottom: 16px;
      color: #ff9800;
    }

    .warning-text {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 12px;
      text-align: center;
      color: var(--text-color);
    }

    .note-text {
      font-size: 14px;
      color: var(--secondary-text-color);
      text-align: center;
      margin-bottom: 0;
      padding: 8px 12px;
      background-color: rgba(var(--theme-color-rgb), 0.05);
      border-radius: 6px;
      width: 100%;
    }
  }

  .modal-footer {
    padding: 16px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid var(--border-color);

    button {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none !important;
      }
    }

    .cancel-btn {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);

      &:hover:not(:disabled) {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    .confirm-btn {
      background-color: #f44336;
      color: white;
      border: none;

      &:hover:not(:disabled) {
        background-color: #e53935;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
      }
    }
  }
}


.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}


.loader-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid #fff;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}


.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}



</style>

<!-- 全局样式，不受scoped限制 -->
<style lang="scss">
@use '@/assets/styles/no-plan-card' as *;

.stats-card.warning-card {
  border-color: #ff9800 !important;
  box-shadow: none !important;

  .stats-icon {
    background-color: rgba(255, 152, 0, 0.1) !important;
    color: #ff9800 !important;
  }

  .stats-value {
    color: #ff9800 !important;
  }
}

.stats-card.danger-card {
  border-color: #f44336 !important;
  box-shadow: none !important;

  .stats-icon {
    background-color: rgba(244, 67, 54, 0.1) !important;
    color: #f44336 !important;
  }

  .stats-value {
    color: #f44336 !important;
  }
}


.eztheme-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 8px 16px !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  background-color: rgba(var(--theme-color-rgb), 0.1) !important;
  color: var(--theme-color) !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  font-weight: 500 !important;
  margin: 8px 0 !important;
  text-decoration: none !important;
  border-bottom: none !important;
  text-align: center !important;
  box-shadow: none !important;
  border-color: transparent !important;
  width: auto !important;

  &:hover, &:active, &:focus, &:visited {
    background-color: rgba(var(--theme-color-rgb), 0.2) !important;
    transform: translateY(-1px) !important;
    box-shadow: none !important;
    border-bottom: none !important;
    text-decoration: none !important;
    color: var(--theme-color) !important;
    border-color: transparent !important;
  }

  &:active {
    transform: translateY(0) !important;
    box-shadow: none !important;
  }

  &:focus {
    outline: none !important;
    box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.3) !important;
  }
}


a.eztheme-btn {
  background-image: none !important;
  background-repeat: no-repeat !important;
  background-position: initial !important;
  background-size: initial !important;
  text-decoration: none !important;
  border-bottom: none !important;

  &::after, &::before {
    display: none !important;
    content: none !important;
  }
}


.stats-card.balance-card.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stats-card.balance-card.clickable:hover {
  background-color: rgba(var(--theme-color-rgb), 0.08);
  transform: none !important;
}

.stats-card.balance-card .stats-value {
  color: var(--theme-color);
}

.dashboard-card,
.stats-card {
  border-radius: 30px !important;
  overflow: hidden !important;
  transform: none !important;
  filter: none !important;
  box-shadow: none !important;
}

.dashboard-card:hover,
.stats-card:hover,
.app-card--hoverable:hover,
.client-guide-section:hover,
.client-guide-tab:hover,
.client-download-item:hover,
.pending-item:hover,
.eztheme-btn:hover,
.eztheme-btn:active,
.eztheme-btn:focus,
.eztheme-btn:visited {
  transform: none !important;
  filter: none !important;
  box-shadow: none !important;
}

.card-body,
.card-header,
.notice-item,
.pending-item,
.download-option,
.client-item,
.import-card,
.guide-step,
.app-item,
.platform-tab,
.qr-code-container {
  border-radius: 22px !important;
}

.pending-icon,
.stats-icon,
.option-icon,
.client-icon,
.guide-icon,
.btn-notice,
.eztheme-btn,
.btn-outline,
.action-button {
  border-radius: 18px !important;
}

.water-container,
.water-progress {
  border-radius: inherit !important;
}

</style>


