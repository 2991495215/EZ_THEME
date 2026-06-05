<template>

  <div class="landing-page" :class="{ 'dark-theme': isDarkTheme }" @wheel="handleWheel" @scroll="handleScroll" ref="landingPageRef">



    

    <div class="background-decoration">

      <div class="bg-circle circle-1"></div>

      <div class="bg-circle circle-2"></div>

      <div class="bg-circle circle-3"></div>


      <div class="bg-grid"></div>

    </div>

    <div class="top-toolbar">

      <ThemeToggle />

      <LanguageSelector />

    </div>

    <div class="content-container">

      <div class="hero-badge">

        <span class="badge-pulse"></span>

        <span>{{ $t('landing.scrollText') }}</span>

      </div>

      <div class="site-title">

        <img v-if="siteConfig.showLogo" src="/images/logo.png" alt="Logo" class="site-logo-img" />

        <span>{{ siteConfig.siteName }}</span>

      </div>

      <div class="landing-text">{{ $t('landing.mainText') }}</div>

      <div class="hero-actions">

        <button class="primary-action" @click="navigateToLogin">

          <span>{{ $t('common.login') }}</span>

          <IconChevronDown :size="18" :stroke-width="1.7" />

        </button>

        <button class="secondary-action" @click="navigateToLogin">{{ $t('common.register') }}</button>

      </div>

      

    </div>

    <div class="scroll-arrow-container" @click="navigateToLogin">

      <div class="scroll-text">{{ $t('landing.scrollText') }}</div>

      <div class="scroll-line"></div>

    </div>

    

    <!-- 页面过渡遮罩 -->

    <div class="page-transition-mask" :class="{ 'active': isTransitioning }"></div>

  </div>

</template>



<script>

import { ref, onMounted, onUnmounted, computed } from 'vue';

import { useRouter } from 'vue-router';

import { useStore } from '@/store/useLegacyStore';

import { useI18n } from 'vue-i18n';

import { SITE_CONFIG, DEFAULT_CONFIG } from '@/utils/baseConfig';


import ThemeToggle from '@/components/common/ThemeToggle.vue';

import LanguageSelector from '@/components/common/LanguageSelector.vue';

import { IconChevronDown } from '@tabler/icons-vue';

import DomainAuthAlert from '@/components/common/DomainAuthAlert.vue';



export default {

  name: 'LandingPage',

  components: {

    ThemeToggle,

    LanguageSelector,

    IconChevronDown,

    DomainAuthAlert

  },

  setup() {

    const router = useRouter();

    const store = useStore();

    const { t } = useI18n();

    const landingPageRef = ref(null);

    

    const isDarkTheme = computed(() => store.getters.currentTheme === 'dark');

    

    const siteConfig = ref(SITE_CONFIG);

    const defaultConfig = ref(DEFAULT_CONFIG);

    

    const isTransitioning = ref(false);

    


    

    const handleScroll = (e) => {

      if (e.currentTarget === landingPageRef.value && window.scrollY > 100) {

        navigateToLogin();

      }

    };

    

    const handleWheel = (e) => {

      if (e.currentTarget === landingPageRef.value && e.deltaY > 0) {

        navigateToLogin();

      }

    };

    

    const navigateToLogin = () => {

      if (isTransitioning.value) {

        return;

      }



      isTransitioning.value = true;

      

      document.body.classList.add('page-transitioning');

      

      console.log(t('landing.navigatingToLogin', 'Navigating to login page'));

      

      setTimeout(() => {

        router.push('/login');

      }, 600); 
    };

    

    let touchStartY = 0;

    let handleTouchStart, handleTouchMove;

    

    onMounted(() => {



      

      handleTouchStart = (e) => {

        if (e.currentTarget === landingPageRef.value || landingPageRef.value.contains(e.target)) {

          touchStartY = e.touches[0].clientY;

        }

      };

      

      handleTouchMove = (e) => {

        if (e.currentTarget === landingPageRef.value || landingPageRef.value.contains(e.target)) {

          const touchY = e.touches[0].clientY;

          if (touchStartY - touchY > 50) { 
            navigateToLogin();

          }

        }

      };

      

      if (landingPageRef.value) {

        landingPageRef.value.addEventListener('touchstart', handleTouchStart, { passive: true });

        landingPageRef.value.addEventListener('touchmove', handleTouchMove, { passive: true });

      }

    });

    

    onUnmounted(() => {

      if (landingPageRef.value) {

        landingPageRef.value.removeEventListener('touchstart', handleTouchStart);

        landingPageRef.value.removeEventListener('touchmove', handleTouchMove);

      }

    });

    

    return {

      landingPageRef,

      siteConfig,

      defaultConfig,

      isDarkTheme,

      isTransitioning,

      navigateToLogin,

      handleScroll,

      handleWheel,


    };

  }

};

</script>



<style lang="scss" scoped>

.landing-page {

  position: relative;

  width: 100%;

  height: 100vh;

  overflow: hidden;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  background: #020617;

  color: rgba(255, 255, 255, 0.94);

  transition: color 0.3s ease;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background-size: 320% 320%, 300% 300%, 310% 310%, 100% 100%;
    animation: landingAurora 22s ease-in-out infinite alternate;
    transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: none;
    will-change: opacity, background-position;
  }

  &::before {
    background:
      radial-gradient(circle at 16% 12%, rgba(147, 197, 253, 0.16), transparent 30%),
      radial-gradient(circle at 88% 28%, rgba(216, 180, 254, 0.12), transparent 28%),
      radial-gradient(circle at 48% 94%, rgba(94, 234, 212, 0.12), transparent 32%),
      linear-gradient(135deg, #fbfdff 0%, #f4f8ff 48%, #fbffff 100%);
    opacity: 1;
  }

  &::after {
    background:
      radial-gradient(circle at 18% 14%, rgba(37, 99, 235, 0.52), transparent 42%),
      radial-gradient(circle at 86% 26%, rgba(126, 34, 206, 0.46), transparent 40%),
      radial-gradient(circle at 48% 94%, rgba(13, 148, 136, 0.38), transparent 44%),
      linear-gradient(135deg, #020617 0%, #070b1d 48%, #031513 100%);
    opacity: 0;
  }

  &.dark-theme::before {
    opacity: 0;
  }

  &.dark-theme::after {
    opacity: 0.36;
    animation-duration: 22s;
  }

}





.background-decoration {

  position: absolute;

  top: 0;

  left: 0;

  width: 100%;

  height: 100%;

  z-index: 1;

  pointer-events: none;

  overflow: hidden;

  

  @supports (-webkit-touch-callout: none) {

    display: none;

  }

  

  .bg-circle {

    position: absolute;

    border-radius: 50%;

    filter: blur(30px) saturate(1.05) brightness(1.02);
    opacity: 0.5; 
    animation: orbTravel 12s infinite cubic-bezier(0.45, 0, 0.55, 1);

    transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), filter 0.9s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.9s cubic-bezier(0.22, 1, 0.36, 1);

    mix-blend-mode: normal;

    will-change: transform;
    

    .dark-theme & {
      opacity: 0.58;
      filter: blur(68px) saturate(1.45) brightness(1.08);
      mix-blend-mode: screen;
    }

    @supports (-webkit-touch-callout: none) {

      filter: blur(20px);

      opacity: 0.22;

      animation-duration: 40s; 
    }

  }

  

  .circle-1 {

    width: clamp(128px, 12vw, 190px);

    height: clamp(128px, 12vw, 190px);

    background: rgba(96, 165, 250, 0.46);

    top: -8%;

    left: -4%;

    animation-duration: 10s;
    animation-name: blueOrbTravelDark;

    

    .dark-theme & {
      width: 30vw;
      height: 30vw;
      background: rgba(59, 130, 246, 0.62); 
      animation-name: blueOrbTravelDark;
      animation-duration: 10s;
    }

  }

  

  .circle-2 {

    width: clamp(118px, 11vw, 176px);

    height: clamp(118px, 11vw, 176px);

    background: rgba(192, 132, 252, 0.38);

    top: 8%;

    right: -5%;

    animation-duration: 11s;
    animation-name: purpleOrbTravelDark;
    animation-delay: -3s;

    

    .dark-theme & {
      width: 28vw;
      height: 28vw;
      background: rgba(168, 85, 247, 0.58); 
      animation-name: purpleOrbTravelDark;
      animation-duration: 11s;
    }

  }

  

  .circle-3 {

    width: clamp(128px, 12vw, 190px);

    height: clamp(128px, 12vw, 190px);

    background: rgba(45, 212, 191, 0.38);

    bottom: -8%;

    left: 30%;

    animation-duration: 12s;
    animation-name: cyanOrbTravelDark;
    animation-delay: -6s;

    

    .dark-theme & {
      width: 30vw;
      height: 30vw;
      background: rgba(45, 212, 191, 0.6); 
      animation-name: cyanOrbTravelDark;
      animation-duration: 12s;
    }

  }



}



@keyframes blueOrbTravel {

  0% { transform: translate3d(0, 0, 0) scale(1); }

  20% { transform: translate3d(38vw, 16vh, 0) scale(1.12); }

  48% { transform: translate3d(64vw, 50vh, 0) scale(0.93); }

  74% { transform: translate3d(26vw, 66vh, 0) scale(1.09); }

  100% { transform: translate3d(0, 0, 0) scale(1); }

}

@keyframes purpleOrbTravel {

  0% { transform: translate3d(0, 0, 0) scale(1); }

  22% { transform: translate3d(-36vw, 18vh, 0) scale(1.14); }

  50% { transform: translate3d(-68vw, 52vh, 0) scale(0.94); }

  78% { transform: translate3d(-30vw, 68vh, 0) scale(1.1); }

  100% { transform: translate3d(0, 0, 0) scale(1); }

}

@keyframes cyanOrbTravel {

  0% { transform: translate3d(0, 0, 0) scale(1); }

  26% { transform: translate3d(32vw, -30vh, 0) scale(1.1); }

  54% { transform: translate3d(-38vw, -56vh, 0) scale(0.93); }

  82% { transform: translate3d(20vw, -70vh, 0) scale(1.14); }

  100% { transform: translate3d(0, 0, 0) scale(1); }

}

@keyframes blueOrbTravelDark {

  0% { transform: translate3d(0, 0, 0) scale(1); }

  20% { transform: translate3d(42vw, 18vh, 0) scale(1.14); }

  48% { transform: translate3d(70vw, 54vh, 0) scale(0.92); }

  74% { transform: translate3d(28vw, 70vh, 0) scale(1.1); }

  100% { transform: translate3d(0, 0, 0) scale(1); }

}

@keyframes purpleOrbTravelDark {

  0% { transform: translate3d(0, 0, 0) scale(1); }

  22% { transform: translate3d(-40vw, 20vh, 0) scale(1.16); }

  50% { transform: translate3d(-74vw, 56vh, 0) scale(0.94); }

  78% { transform: translate3d(-32vw, 72vh, 0) scale(1.12); }

  100% { transform: translate3d(0, 0, 0) scale(1); }

}

@keyframes cyanOrbTravelDark {

  0% { transform: translate3d(0, 0, 0) scale(1); }

  26% { transform: translate3d(34vw, -34vh, 0) scale(1.12); }

  54% { transform: translate3d(-42vw, -62vh, 0) scale(0.92); }

  82% { transform: translate3d(22vw, -76vh, 0) scale(1.16); }

  100% { transform: translate3d(0, 0, 0) scale(1); }

}

@keyframes orbTravel {

  0% {

    transform: translate3d(0, 0, 0) scale(1);

  }

  28% {

    transform: translate3d(18vw, -16vh, 0) scale(1.08);

  }

  56% {

    transform: translate3d(-16vw, 18vh, 0) scale(0.95);

  }

  78% {

    transform: translate3d(12vw, 14vh, 0) scale(1.05);

  }

  100% {

    transform: translate3d(0, 0, 0) scale(1);

  }

}

@keyframes orbTravelDark {

  0% {

    transform: translate3d(0, 0, 0) scale(1);

  }

  30% {

    transform: translate3d(22vw, -18vh, 0) scale(1.11);

  }

  62% {

    transform: translate3d(-20vw, 20vh, 0) scale(0.94);

  }

  100% {

    transform: translate3d(8vw, -8vh, 0) scale(1.06);

  }

}



@keyframes landingAurora {

  0% { background-position: 0% 0%, 100% 24%, 50% 100%, 0 0; }

  32% { background-position: 36% 18%, 68% 64%, 28% 72%, 0 0; }

  68% { background-position: 62% 52%, 24% 36%, 76% 24%, 0 0; }

  100% { background-position: 100% 82%, 0% 12%, 88% 0%, 0 0; }

}

.bg-grid {

  position: absolute;

  inset: 0;

  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);

  background-size: 64px 64px;

  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.8), transparent 72%);

  opacity: 0.7;

  animation: gridDrift 10s linear infinite;

}



.landing-page.dark-theme .bg-grid {

  background-image:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);

  opacity: 0.48;

}

@keyframes gridDrift {

  from { transform: translate3d(0, 0, 0); }

  to { transform: translate3d(64px, 64px, 0); }

}



.top-toolbar {

  position: fixed;

  top: 24px;

  right: 28px;

  display: flex;

  gap: 12px;

  z-index: 100;

  padding: 8px;

  border: 1px solid rgba(255, 255, 255, 0.14);

  border-radius: 999px;

  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));

  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.18);

  backdrop-filter: blur(26px) saturate(145%);

  -webkit-backdrop-filter: blur(26px) saturate(145%);

  :deep(.theme-toggle),
  :deep(.language-btn) {
    background-color: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  :deep(.theme-toggle:hover),
  :deep(.language-btn:hover) {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.28);
    color: #ffffff;
  }

  .dark-theme & {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.28);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.32);

    :deep(.theme-toggle),
    :deep(.language-btn) {
      background-color: var(--card-background);
      border-color: var(--border-color);
      color: var(--text-color);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    :deep(.theme-toggle:hover),
    :deep(.language-btn:hover) {
      background-color: rgba(var(--theme-color-rgb), 0.1);
      border-color: var(--theme-color);
      color: var(--theme-color);
    }
  }

}





.content-container {

  position: relative;

  z-index: 10;

  text-align: center;

  padding: 56px 44px 36px;

  max-width: 980px;

  width: min(92vw, 980px);

  border: 1px solid rgba(148, 163, 184, 0.18);

  border-radius: 36px;

  background: linear-gradient(135deg, rgba(255, 255, 255, 0.54), rgba(255, 255, 255, 0.25));

  box-shadow: 0 28px 80px rgba(96, 165, 250, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.64);

  backdrop-filter: blur(26px) saturate(145%);

  -webkit-backdrop-filter: blur(26px) saturate(145%);

}



.dark-theme .content-container {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.105), rgba(255, 255, 255, 0.035));
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.site-title {

  font-size: clamp(52px, 9vw, 118px);

  font-weight: 800;

  margin-bottom: 22px;

  background: linear-gradient(110deg, #1f2937 0%, rgba(51, 65, 85, 0.92) 52%, rgba(37, 99, 235, 0.62) 100%);

  -webkit-background-clip: text;

  background-clip: text;

  color: transparent;

  text-align: center;

  letter-spacing: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 18px;

  line-height: 0.95;

  text-shadow: 0 18px 60px rgba(59, 130, 246, 0.16);

  .site-logo-img {

    height: clamp(48px, 7vw, 86px);

    width: clamp(48px, 7vw, 86px);

    border-radius: 24px;

    object-fit: cover;

    box-shadow: 0 18px 60px rgba(59, 130, 246, 0.28);

  }

}

.dark-theme .site-title {
  background: linear-gradient(110deg, #ffffff 0%, rgba(255, 255, 255, 0.86) 48%, rgba(147, 197, 253, 0.56) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 0 18px 60px rgba(59, 130, 246, 0.24);
}



.landing-text {

  font-size: clamp(1.05rem, 2vw, 1.45rem);

  font-weight: 400;

  line-height: 1.8;

  margin: 0 auto 2.2rem;

  color: rgba(51, 65, 85, 0.72);

  opacity: 1;

  max-width: 720px;
  

  @media (max-width: 768px) {

    font-size: 1.25rem;

  }

  

  @media (max-width: 480px) {

    font-size: 1rem;

  }

}

.dark-theme .landing-text {
  color: rgba(255, 255, 255, 0.66);
}

.hero-badge {

  display: inline-flex;

  align-items: center;

  gap: 10px;

  margin-bottom: 28px;

  padding: 10px 16px;

  border: 1px solid rgba(148, 163, 184, 0.22);

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.42);

  color: rgba(51, 65, 85, 0.72);

  font-size: 0.74rem;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.12em;

  backdrop-filter: blur(18px);

  -webkit-backdrop-filter: blur(18px);

}

.dark-theme .hero-badge {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.72);
}

.badge-pulse {

  position: relative;

  width: 9px;

  height: 9px;

  border-radius: 999px;

  background: #22c55e;

  box-shadow: 0 0 18px rgba(34, 197, 94, 0.9);

}

.badge-pulse::before {

  content: '';

  position: absolute;

  inset: 0;

  border-radius: inherit;

  background: inherit;

  animation: badgePing 1.8s infinite ease-out;

}

@keyframes badgePing {

  from {

    opacity: 0.75;

    transform: scale(1);

  }

  to {

    opacity: 0;

    transform: scale(2.8);

  }

}

.hero-actions {

  display: flex;

  justify-content: center;

  align-items: center;

  gap: 14px;

  margin-bottom: 32px;

  flex-wrap: wrap;

}

.primary-action,
.secondary-action {

  min-height: 50px;

  padding: 0 24px;

  border-radius: 999px;

  font-weight: 700;

  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;

}

.primary-action {

  display: inline-flex;

  align-items: center;

  gap: 8px;

  background: #ffffff;

  color: #05060f;

  box-shadow: 0 16px 44px rgba(59, 130, 246, 0.14);

}

.dark-theme .primary-action {
  box-shadow: 0 16px 44px rgba(255, 255, 255, 0.18);
}

.primary-action svg {

  transform: rotate(-90deg);

  transition: transform 0.25s ease;

}

.secondary-action {

  border: 1px solid rgba(37, 99, 235, 0.18);

  background: rgba(255, 255, 255, 0.3);

  color: rgba(30, 41, 59, 0.86);

  backdrop-filter: blur(18px);

  -webkit-backdrop-filter: blur(18px);

}

.dark-theme .secondary-action {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.88);
}

.primary-action:hover,
.secondary-action:hover {

  transform: translateY(-2px) scale(1.02);

}

.primary-action:hover svg {

  transform: rotate(-90deg) translateY(3px);

}

.secondary-action:hover {

  border-color: rgba(37, 99, 235, 0.28);

  background: rgba(255, 255, 255, 0.52);

}

.dark-theme .secondary-action:hover {
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.1);
}

.scroll-arrow-container {

  position: fixed;

  bottom: 38px;

  left: 50%;

  transform: translateX(-50%);

  display: flex;

  flex-direction: column;

  align-items: center;

  gap: 10px;

  cursor: pointer;

  z-index: 10;

  color: rgba(51, 65, 85, 0.42);

  transition: transform 0.3s ease, color 0.3s ease;

  &:hover {

    transform: translateX(-50%) translateY(5px);

    color: rgba(51, 65, 85, 0.7);

  }

}

.dark-theme .scroll-arrow-container {
  color: rgba(255, 255, 255, 0.42);

  &:hover {
    color: rgba(255, 255, 255, 0.78);
  }
}

.scroll-line {

  width: 1px;

  height: 54px;

  background: linear-gradient(to bottom, transparent, rgba(51, 65, 85, 0.32), transparent);

  animation: scrollLine 2.2s infinite ease-in-out;

}

.dark-theme .scroll-line {
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.48), transparent);
}

.scroll-text {

  font-size: 0.72rem;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.18em;

}

@keyframes scrollLine {

  0%, 100% {

    transform: scaleY(0.75);

    opacity: 0.48;

  }

  50% {

    transform: scaleY(1);

    opacity: 1;

  }

}





.page-transition-mask {

  position: fixed;

  top: 0;

  left: 0;

  width: 100%;

  height: 100%;

  background: #02030a;

  z-index: 1000;

  opacity: 0;

  pointer-events: none;

  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  

  &.active {

    opacity: 1;

    pointer-events: all;

  }

}





@media (max-width: 768px) {

  .content-container {

    padding: 38px 22px 24px;

    border-radius: 28px;

  }

  .site-title {

    flex-direction: column;

    gap: 12px;

  }

  .top-toolbar {

    top: 16px;

    right: 16px;

  }

  .scroll-arrow-container {

    bottom: 24px;

  }

}

</style> 
