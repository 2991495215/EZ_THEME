<template>
  <transition-group tag="div" name="toast-list" class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="[`toast-${toast.type}`, { 'toast-show': toast.show }]"
      :data-id="toast.id"
      @click="removeToast(toast.id)"
      @mouseenter="pauseToastTimer(toast.id)"
      @mouseleave="resumeToastTimer(toast.id)"
    >
      <div class="toast-icon">
        <span class="toast-icon-ring"></span>
        <svg class="icon" :class="getIconClass(toast.type)">
          <use :xlink:href="getIconPath(toast.type)"></use>
        </svg>
      </div>
      <div class="toast-content">
        <span class="toast-title">{{ getToastTitle(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
      <div class="toast-close">
        <button type="button" class="close-btn" @click.stop="removeToast(toast.id)">
          &times;
        </button>
      </div>
      <div class="toast-progress-bar" :data-id="toast.id" :style="{ animationDuration: `${toast.duration}ms` }"></div>
    </div>
  </transition-group>
</template>

<script>
import { useToast } from '@/composables/useToast';

export default {
  name: 'ToastNotification',
  setup() {
    const { toasts, removeToast, pauseToastTimer, resumeToastTimer } = useToast();
    
    const getIconClass = (type) => {
      return `icon-${type}`;
    };
    
    const getIconPath = (type) => {
      switch (type) {
        case 'success':
          return '#icon-check-circle';
        case 'error':
          return '#icon-error-circle';
        case 'warning':
          return '#icon-warning';
        default:
          return '#icon-info-circle';
      }
    };
    
    const getToastTitle = (type) => {
      switch (type) {
        case 'success':
          return '操作成功';
        case 'error':
          return '操作失败';
        case 'warning':
          return '温馨提示';
        default:
          return '系统通知';
      }
    };
    
    return {
      toasts,
      removeToast,
      pauseToastTimer,
      resumeToastTimer,
      getIconClass,
      getIconPath,
      getToastTitle
    };
  }
};
</script>

<style lang="scss" scoped>
.toast-container {
  position: fixed;
  top: 22px;
  right: 22px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
  pointer-events: none;
  width: 420px;
  
  @media (max-width: 576px) {
    top: 0;
    left: 0;
    right: 0;
    padding: 16px;
    width: 100%;
    align-items: stretch;
  }
}

.toast {
  min-width: 320px;
  max-width: 400px;
  background: rgba(var(--card-background-rgb, 255, 255, 255), 0.92);
  color: var(--text-color);
  border: 1px solid rgba(var(--theme-color-rgb), 0.12);
  border-radius: 18px;
  padding: 16px 18px 18px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16), 0 6px 16px rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 14px;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 18% 20%, rgba(var(--theme-color-rgb), 0.16), transparent 36%);
  }
  
  @media (prefers-color-scheme: dark) {
    background: rgba(var(--card-background-rgb, 30, 30, 30), 0.9);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.34), 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 576px) {
    min-width: 0;
    width: 100%;
    max-width: none;
    transform: translateY(-100%);
    border-radius: 16px;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
    
    &.toast-show {
      transform: translateY(0);
    }
    
    &:hover {
      transform: translateY(0);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
    }
  }
  
  &.toast-show {
    opacity: 1;
    transform: translateX(0);
  }
  
  &:hover {
    transform: translateY(-3px) scale(1.01);
    box-shadow: 0 22px 54px rgba(15, 23, 42, 0.2), 0 8px 18px rgba(15, 23, 42, 0.1);
    
    .toast-progress-bar {
      animation-play-state: paused;
    }
  }
  
  &.toast-success {
    border-color: rgba(var(--success-color-rgb, 34, 197, 94), 0.22);
    
    &::before {
      background: radial-gradient(circle at 16% 24%, rgba(var(--success-color-rgb, 34, 197, 94), 0.24), transparent 38%);
    }
    
    .toast-icon {
      color: var(--success-color);
      background: rgba(var(--success-color-rgb, 34, 197, 94), 0.12);
      box-shadow: 0 0 0 8px rgba(var(--success-color-rgb, 34, 197, 94), 0.05);
    }
    
    .toast-progress-bar {
      background: linear-gradient(90deg, rgba(var(--success-color-rgb, 34, 197, 94), 0.95), rgba(var(--success-color-rgb, 34, 197, 94), 0.45));
    }
  }
  
  &.toast-error {
    border-color: rgba(var(--error-color-rgb, 239, 68, 68), 0.22);
    
    .toast-icon {
      color: var(--error-color);
      background: rgba(var(--error-color-rgb, 239, 68, 68), 0.12);
      box-shadow: 0 0 0 8px rgba(var(--error-color-rgb, 239, 68, 68), 0.05);
    }
    
    .toast-progress-bar {
      background: linear-gradient(90deg, rgba(var(--error-color-rgb, 239, 68, 68), 0.95), rgba(var(--error-color-rgb, 239, 68, 68), 0.45));
    }
  }
  
  &.toast-warning {
    border-color: rgba(var(--warning-color-rgb, 245, 158, 11), 0.24);
    
    .toast-icon {
      color: var(--warning-color);
      background: rgba(var(--warning-color-rgb, 245, 158, 11), 0.12);
      box-shadow: 0 0 0 8px rgba(var(--warning-color-rgb, 245, 158, 11), 0.05);
    }
    
    .toast-progress-bar {
      background: linear-gradient(90deg, rgba(var(--warning-color-rgb, 245, 158, 11), 0.95), rgba(var(--warning-color-rgb, 245, 158, 11), 0.45));
    }
  }
  
  &.toast-info {
    border-color: rgba(var(--info-color-rgb, 59, 130, 246), 0.22);
    
    .toast-icon {
      color: var(--info-color);
      background: rgba(var(--info-color-rgb, 59, 130, 246), 0.12);
      box-shadow: 0 0 0 8px rgba(var(--info-color-rgb, 59, 130, 246), 0.05);
    }
    
    .toast-progress-bar {
      background: linear-gradient(90deg, rgba(var(--info-color-rgb, 59, 130, 246), 0.95), rgba(var(--info-color-rgb, 59, 130, 246), 0.45));
    }
  }
}

.toast-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  
  .toast-icon-ring {
    position: absolute;
    inset: 5px;
    border-radius: inherit;
    border: 1px solid currentColor;
    opacity: 0.22;
  }
  
  .icon {
    width: 24px;
    height: 24px;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    position: relative;
    z-index: 1;
    
    &.icon-success {
      stroke: var(--success-color);
    }
    
    &.icon-error {
      stroke: var(--error-color);
    }
    
    &.icon-warning {
      stroke: var(--warning-color);
    }
    
    &.icon-info {
      stroke: var(--info-color);
    }
  }
}

.toast-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.toast-title {
  color: var(--text-color);
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.toast-message {
  color: var(--secondary-text-color);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.45;
  word-break: break-word;
}

.toast-close {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
  
  .close-btn {
    width: 26px;
    height: 26px;
    background: rgba(var(--theme-color-rgb), 0.06);
    border: 1px solid rgba(var(--theme-color-rgb), 0.08);
    border-radius: 50%;
    font-size: 1.1rem;
    line-height: 1;
    color: var(--secondary-text-color);
    cursor: pointer;
    padding: 0;
    opacity: 0.68;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      opacity: 1;
      color: var(--text-color);
      background: rgba(var(--theme-color-rgb), 0.12);
      transform: rotate(90deg);
    }
  }
}

.toast-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  transform-origin: left;
  animation: progress-bar-shrink 3000ms linear forwards;
  animation-play-state: running;
  opacity: 0.9;
  will-change: transform;
}

@keyframes progress-bar-shrink {
  0% {
    transform: scaleX(1);
  }
  100% {
    transform: scaleX(0);
  }
}

.toast-list-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.1s;
}

.toast-list-leave-active {
  transition: all 0.4s cubic-bezier(0.6, 0.04, 0.98, 0.335);
  position: absolute;
  
  @media (max-width: 576px) {
    width: calc(100% - 32px);
    left: 16px;
    right: 16px;
  }
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100%);
  
  @media (max-width: 576px) {
    transform: translateY(-100%);
  }
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(100%);
  
  @media (max-width: 576px) {
    transform: translateY(-100%);
  }
}
</style> 
