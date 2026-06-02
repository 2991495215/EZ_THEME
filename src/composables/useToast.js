
import { ref } from 'vue';

const toasts = ref([]);
let toastId = 0;

const toastTimers = {};
const animationTimers = {};
const toastTimes = {};

const TOAST_DURATION = 3000;

export function useToast() {
  const showToast = (message, type = 'info', duration = TOAST_DURATION) => {
    const finalDuration = duration;
    
    const id = toastId++;
    
    const toast = {
      id,
      message,
      type,
      show: false, 
      duration: finalDuration
    };
    
    toastTimes[id] = {
      startTime: Date.now(),
      remainingTime: finalDuration,
      isPaused: false
    };
    
    toasts.value.push(toast);
    
    setTimeout(() => {
      const index = toasts.value.findIndex(t => t.id === id);
      if (index !== -1) {
        toasts.value[index].show = true; 
      }
    }, 50);
    
    startToastTimer(id, finalDuration);
    
    return id;
  };
  
  const startToastTimer = (id, duration) => {
    if (toastTimers[id]) {
      clearTimeout(toastTimers[id]);
    }
    
    toastTimers[id] = setTimeout(() => {
      removeToast(id);
    }, duration);
  };
  
  const pauseToastTimer = (id) => {
    if (!toastTimes[id] || toastTimes[id].isPaused) return;
    
    if (toastTimers[id]) {
      clearTimeout(toastTimers[id]);
      delete toastTimers[id];
    }
    
    const elapsed = Date.now() - toastTimes[id].startTime;
    toastTimes[id].remainingTime = Math.max(0, toastTimes[id].remainingTime - elapsed);
    toastTimes[id].isPaused = true;
    
    const toastElement = document.querySelector(`.toast[data-id="${id}"] .toast-progress-bar`);
    if (toastElement) {
      const computedStyle = window.getComputedStyle(toastElement);
      const transform = computedStyle.getPropertyValue('transform');
      toastElement.style.transform = transform;
      toastElement.style.animationPlayState = 'paused';
    }
  };
  
  const resumeToastTimer = (id) => {
    if (!toastTimes[id] || !toastTimes[id].isPaused) return;
    
    toastTimes[id].startTime = Date.now();
    toastTimes[id].isPaused = false;
    
    startToastTimer(id, toastTimes[id].remainingTime);
    
    const toastElement = document.querySelector(`.toast[data-id="${id}"] .toast-progress-bar`);
    if (toastElement) {
      toastElement.style.animationPlayState = 'running';
    }
  };
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id);
    if (index !== -1) {
      if (toastTimers[id]) {
        clearTimeout(toastTimers[id]);
        delete toastTimers[id];
      }
      
      toasts.value[index].show = false;
      
      if (animationTimers[id]) {
        clearTimeout(animationTimers[id]);
      }
      
      animationTimers[id] = setTimeout(() => {
        toasts.value = toasts.value.filter(toast => toast.id !== id);
        delete animationTimers[id];
        delete toastTimes[id];
      }, 400);
    }
  };
  
  const clearToasts = () => {
    Object.keys(toastTimers).forEach(id => {
      clearTimeout(toastTimers[id]);
      delete toastTimers[id];
    });
    
    Object.keys(animationTimers).forEach(id => {
      clearTimeout(animationTimers[id]);
      delete animationTimers[id];
    });
    
    Object.keys(toastTimes).forEach(id => {
      delete toastTimes[id];
    });
    
    toasts.value = [];
  };
  
  showToast.success = (message, duration = TOAST_DURATION) => {
    return showToast(message, 'success', duration);
  };
  
  showToast.error = (message, duration = TOAST_DURATION) => {
    return showToast(message, 'error', duration);
  };
  
  showToast.warning = (message, duration = TOAST_DURATION) => {
    return showToast(message, 'warning', duration);
  };
  
  showToast.info = (message, duration = TOAST_DURATION) => {
    return showToast(message, 'info', duration);
  };
  
  return {
    toasts,
    showToast,
    removeToast,
    pauseToastTimer,
    resumeToastTimer,
    clearToasts
  };
} 
