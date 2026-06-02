<template>

  <div class="user-avatar-container" ref="avatarContainer">

    <div class="avatar-wrapper" @click="toggleDropdown">

      <img 

        v-if="avatarUrl" 

        :src="avatarUrl" 

        alt="User Avatar" 

        class="avatar-image"

      />

      <div v-else class="avatar-placeholder">

        <IconUser class="user-icon" />

      </div>

    </div>

    

    <transition name="fade">

      <div 

        class="dropdown-menu" 

        v-if="isDropdownOpen"

      >

        <div class="menu-item" @click="navigateTo('/profile')">

          <IconUser class="menu-icon" />

          <span>{{ $t('common.userCenter') }}</span>

        </div>

        <div class="menu-item" v-if="isXiaoV2board" @click="navigateTo('/wallet/deposit')">

          <IconWallet class="menu-icon" />

          <span>{{ $t('common.myWallet') }}</span>

        </div>

        <div class="menu-item" @click="navigateTo('/profile?openPasswordModal=true')">

          <IconLock class="menu-icon" />

          <span>{{ $t('common.changePassword') }}</span>

        </div>

        <div class="menu-item performance-item" @click.stop="toggleAutoTheme">
          <IconSunMoon class="menu-icon" />
          <span class="menu-label">自动切换主题</span>
          <button class="performance-switch" :class="{ active: isAutoTheme }" type="button" :aria-pressed="isAutoTheme">
            <span class="switch-thumb"></span>
          </button>
        </div>
        <div class="menu-item performance-item" @click.stop="togglePerformanceMode">
          <IconBolt class="menu-icon" />
          <span class="menu-label">{{ performanceModeLabel }}</span>
          <button class="performance-switch" :class="{ active: isPerformanceMode }" type="button" :aria-pressed="isPerformanceMode">
            <span class="switch-thumb"></span>
          </button>
        </div>
        <div class="divider"></div>
        <div class="menu-item logout-item" @click="logout">
          <IconLogout class="menu-icon" />

          <span>{{ $t('common.logoutText') }}</span>

        </div>

      </div>

    </transition>

  </div>

</template>



<script>

import { ref, onMounted, onUnmounted, computed } from 'vue';

import { useRouter } from 'vue-router';

import { useI18n } from 'vue-i18n';

import { useToast } from '@/composables/useToast';
import { usePerformanceMode } from '@/composables/usePerformanceMode';
import { useTheme } from '@/composables/useTheme';
import { useThemeStore } from '@/stores';
import { isXiaoV2board } from '@/utils/baseConfig';
import IconUser from '@/components/icons/IconUser.vue';
import IconLogout from '@/components/icons/IconLogout.vue';
import IconWallet from '@/components/icons/IconWallet.vue';
import IconLock from '@/components/icons/IconLock.vue';
import { IconBolt, IconSunMoon } from '@tabler/icons-vue';



export default {

  name: 'UserAvatar',

  components: {

    IconUser,
    IconLogout,
    IconWallet,
    IconLock,
    IconBolt,
    IconSunMoon
  },

  props: {

    username: {

      type: String,

      default: ''

    },

    avatarUrl: {

      type: String,

      default: ''

    }

  },

  setup() {

    const router = useRouter();

    const { t } = useI18n();

    const { showToast } = useToast();
    const { applyTheme } = useTheme();
    const themeStore = useThemeStore();
    const isAutoTheme = computed(() => themeStore.isAutoTheme);
    const { isPerformanceMode, performanceModeLabel, togglePerformanceMode } = usePerformanceMode();
    const isDropdownOpen = ref(false);

    const avatarContainer = ref(null);

    

    const toggleDropdown = () => {

      isDropdownOpen.value = !isDropdownOpen.value;

    };

    

    const navigateTo = (path) => {

      isDropdownOpen.value = false;

      router.push(path);

    };

    const toggleAutoTheme = () => {
      themeStore.setAutoTheme(!themeStore.isAutoTheme);
      applyTheme(themeStore.currentTheme);
    };

    

    const logout = async () => {

      try {

        localStorage.removeItem('token'); 
        isDropdownOpen.value = false;

        

        showToast(t('auth.logoutSuccess'), 'success', 3000);

        

        setTimeout(() => {

          router.push('/login');

        }, 500);

      } catch (error) {

        console.error('退出登录失败:', error);

        showToast(t('auth.logoutFailed'), 'error');

      }

    };

    

    const handleClickOutside = (event) => {

      if (avatarContainer.value && !avatarContainer.value.contains(event.target)) {

        isDropdownOpen.value = false;

      }

    };

    

    onMounted(() => {

      document.addEventListener('click', handleClickOutside);

    });

    

    onUnmounted(() => {

      document.removeEventListener('click', handleClickOutside);

    });

    

    return {

      isDropdownOpen,

      toggleDropdown,

      navigateTo,

      logout,
      avatarContainer,
      isPerformanceMode,
      performanceModeLabel,
      togglePerformanceMode,
      isAutoTheme,
      toggleAutoTheme,
      isXiaoV2board: isXiaoV2board()

    };

  }

};

</script>



<style lang="scss" scoped>

.user-avatar-container {

  position: relative;

}



.avatar-wrapper {
  width: 40px;
  height: 40px;
  box-sizing: border-box;
  border-radius: 50%;

  cursor: pointer;

  overflow: hidden;

  background-color: rgba(var(--theme-color-rgb), 0.1);

  border: 1px solid rgba(var(--theme-color-rgb), 0.3);

  transition: all 0.3s ease;

  display: flex;

  align-items: center;

  justify-content: center;

  

  &:hover {

    box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.15);

    transform: translateY(-2px);

  }

  

  .avatar-image {

    width: 100%;

    height: 100%;

    object-fit: cover;

  }

  

  .avatar-placeholder {

    display: flex;

    align-items: center;

    justify-content: center;

    width: 100%;

    height: 100%;

    

    .user-icon {

      width: 20px;

      height: 20px;

      color: var(--theme-color);

    }

  }

}



.dropdown-menu {

  position: absolute;

  top: calc(100% + 8px);

  right: 0;

  width: 220px;

  background: var(--card-background);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-radius: 12px;

  box-shadow: none;
  border: 1px solid var(--border-color);

  overflow: hidden;

  z-index: 100;

  animation: dropdownFadeIn 0.2s ease;

  

  .menu-item {
    display: flex;

    align-items: center;

    padding: 12px 16px;

    cursor: pointer;

    transition: all 0.3s ease;

    border-radius: 0;
    

    .menu-icon {

      width: 18px;

      height: 18px;

      margin-right: 10px;

      color: var(--text-color);

      transition: color 0.3s ease;

    }

    

    span {

      font-size: 14px;

      color: var(--text-color);

      transition: color 0.3s ease;

    }

    

    &:hover {
      background-color: rgba(var(--primary-color-rgb), 0.1);

      color: var(--primary-color);

      transform: none;
      

      .menu-icon, span {

        color: var(--primary-color);

      }

    }

    &.performance-item {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr) 42px;
      align-items: center;
      column-gap: 12px;
      padding-right: 14px;

      .menu-icon {
        margin-right: 0;
      }

      .menu-label {
        min-width: 0;
        color: var(--text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .performance-switch {
      position: relative;
      width: 42px;
      height: 22px;
      padding: 0;
      border-radius: 999px;
      background: rgba(var(--theme-color-rgb), 0.16);
      border: 1px solid rgba(var(--theme-color-rgb), 0.28);
      transition: background-color 0.2s ease, border-color 0.2s ease;
      flex-shrink: 0;
      cursor: pointer;
      appearance: none;
      outline: none;

      .switch-thumb {
        position: absolute;
        top: 3px;
        left: 3px;
        display: block;
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
        transition: transform 0.2s ease, background-color 0.2s ease;
      }

      &.active {
        background: var(--theme-color);
        border-color: var(--theme-color);

        .switch-thumb {
          transform: translateX(20px);
          background: #fff;
        }
      }
    }

    &.logout-item {

      width: 100%;

      margin: 0;

      background-color: rgba(245, 108, 108, 0.08);

      color: #f56c6c;

      .menu-icon, span {

        color: #f56c6c;

      }

      &:hover {

        background-color: rgba(245, 108, 108, 0.14);

        transform: none;

        .menu-icon, span {

          color: #f56c6c;

        }

      }

    }
    

    &:last-child {

      .menu-icon, span {

        transition: color 0.5s ease;

      }

      

      &:hover {

        background-color: rgba(245, 108, 108, 0.14);
        transition: background-color 0.5s ease;

        

        .menu-icon, span {

          color: #f56c6c;

          transition: color 0.5s ease;

        }

      }

    }

  }

  

  .divider {

    height: 1px;

    background-color: var(--border-color);

    margin: 4px 0 0;
  }

}



.fade-enter-active,

.fade-leave-active {

  transition: opacity 0.3s ease, transform 0.3s ease;

}



.fade-enter-from,

.fade-leave-to {

  opacity: 0;

  transform: translateY(-10px);

}



@keyframes dropdownFadeIn {

  from {

    opacity: 0;

    transform: translateY(-10px);

  }

  to {

    opacity: 1;

    transform: translateY(0);

  }

}

</style> 
