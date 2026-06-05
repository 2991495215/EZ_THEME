<template>

  <div class="main-board">

    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->


    

    <!-- 内容区域 - 路由视图 -->

    <div class="content-area">

      <router-view v-slot="{ Component }">

        <transition name="content-transition" mode="out-in" appear>

          <div class="view-wrapper" :key="$route.path">

            <component :is="Component" />

          </div>

        </transition>

      </router-view>

    </div>

    

    <!-- 背景装饰 -->

    <div class="background-decoration">

      <div class="aurora-layer aurora-layer-1"></div>

      <div class="aurora-layer aurora-layer-2"></div>

      <div class="aurora-orb aurora-orb-1"></div>

      <div class="aurora-orb aurora-orb-2"></div>

      <div class="floating-ball ball-1"></div>

      <div class="floating-ball ball-2"></div>

      <div class="floating-ball ball-3"></div>


    </div>

  </div>

</template>



<script>

import { ref, onMounted } from 'vue';



import DomainAuthAlert from '@/components/common/DomainAuthAlert.vue';



export default {

  name: 'MainBoard',

  components: {

    DomainAuthAlert

  },

  setup() {




    onMounted(() => {


    });





  }

};

</script>



<style lang="scss" scoped>

.main-board {

  min-height: 100vh;

  position: relative;

  overflow-x: hidden;

  z-index: 1;

  background:
    radial-gradient(circle at 82% 12%, rgba(79, 70, 229, 0.24), transparent 34%),
    radial-gradient(circle at 16% 22%, rgba(37, 99, 235, 0.28), transparent 36%),
    radial-gradient(circle at 76% 82%, rgba(20, 184, 166, 0.22), transparent 38%),
    linear-gradient(135deg, #d6e8ff 0%, #dce2f6 42%, #d3f0ec 74%, #e2ddf5 100%);
  background-size: 190% 190%, 185% 185%, 195% 195%, 100% 100%;
  animation: mainBoardAurora 6.8s ease-in-out infinite alternate;

}



.content-area {

  padding: 2rem 1rem;

  padding-top: 80px; 

  

  @media (min-width: 768px) {

    padding: 2rem;

    padding-top: 90px;

  }

  

  @media (min-width: 1200px) {

    padding: 2rem 4rem;

    padding-top: 90px;

  }

}



.background-decoration {

  position: fixed;

  top: 0;

  left: 0;

  right: 0;

  bottom: 0;

  z-index: -1;

  overflow: hidden;

  pointer-events: none;

  background:
    linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.2) 42%, transparent 66%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.14), transparent 46%);

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: -18%;
    opacity: 0.52;
    mix-blend-mode: soft-light;
    will-change: transform, opacity;
  }

  &::before {
    background:
      linear-gradient(100deg, transparent 0%, rgba(255, 255, 255, 0.46) 18%, transparent 34%),
      linear-gradient(128deg, transparent 28%, rgba(96, 165, 250, 0.24) 48%, transparent 66%);
    animation: daylightSweep 7.2s ease-in-out infinite alternate;
  }

  &::after {
    background:
      radial-gradient(circle at 22% 30%, rgba(255, 255, 255, 0.28), transparent 18%),
      radial-gradient(circle at 74% 68%, rgba(196, 181, 253, 0.22), transparent 24%),
      linear-gradient(60deg, transparent 16%, rgba(255, 255, 255, 0.12) 44%, transparent 72%);
    animation: daylightShimmer 8.6s ease-in-out infinite alternate;
  }

  @supports (-webkit-touch-callout: none) {

    display: none;

  }

}



.aurora-layer,
.aurora-orb {

  position: absolute;

  border-radius: 999px;

  pointer-events: none;

  will-change: transform, opacity;

}

.aurora-layer {

  inset: -24%;

  opacity: 0.38;

  filter: blur(28px);

  mix-blend-mode: overlay;

}

.aurora-layer-1 {

  background: conic-gradient(from 90deg at 50% 50%, rgba(59, 130, 246, 0.28), rgba(250, 204, 21, 0.2), rgba(34, 197, 94, 0.24), rgba(168, 85, 247, 0.22), rgba(59, 130, 246, 0.28));

  animation: daylightAuroraRotate 12s ease-in-out infinite alternate;

}

.aurora-layer-2 {

  inset: -18% -10%;

  background: linear-gradient(105deg, transparent 18%, rgba(255, 255, 255, 0.46) 38%, rgba(96, 165, 250, 0.18) 52%, transparent 76%);

  opacity: 0.42;

  animation: daylightAuroraDrift 9.5s ease-in-out infinite alternate;

}

.aurora-orb {

  filter: blur(34px);

  mix-blend-mode: screen;

}

.aurora-orb-1 {

  width: 280px;

  height: 280px;

  top: 18%;

  left: 18%;

  background: radial-gradient(circle, rgba(255, 255, 255, 0.76), rgba(96, 165, 250, 0.22) 44%, transparent 72%);

  animation: daylightOrbFloat 6.4s ease-in-out infinite alternate;

}

.aurora-orb-2 {

  width: 230px;

  height: 230px;

  right: 18%;

  bottom: 18%;

  background: radial-gradient(circle, rgba(255, 255, 255, 0.62), rgba(251, 191, 36, 0.24) 46%, transparent 74%);

  animation: daylightOrbFloat 7.4s ease-in-out infinite alternate-reverse;

}

.floating-ball {

  position: absolute;

  border-radius: 50%;

  filter: blur(54px) saturate(0.95) brightness(1);

  opacity: 0.44;

  mix-blend-mode: normal;

  will-change: transform;

}



.ball-1 {

  width: 600px;

  height: 600px;

  background: radial-gradient(circle at 30% 30%, 

    rgba(59, 130, 246, 0.4),

    rgba(59, 130, 246, 0.13) 70%,

    transparent

  );

  top: -10%;

  left: -10%;

  animation: floatingBall1 7s infinite ease-in-out;

}



.ball-2 {

  width: 500px;

  height: 500px;

  background: radial-gradient(circle at 70% 70%, 

    rgba(168, 85, 247, 0.36),

    rgba(168, 85, 247, 0.12) 70%,

    transparent

  );

  top: 40%;

  right: -5%;

  animation: floatingBall2 8s infinite ease-in-out;

}



.ball-3 {

  width: 450px;

  height: 450px;

  background: radial-gradient(circle at 50% 50%, 

    rgba(20, 184, 166, 0.34),

    rgba(20, 184, 166, 0.12) 70%,

    transparent

  );

  bottom: -10%;

  left: 20%;

  animation: floatingBall3 9s infinite ease-in-out;

}



@media (max-width: 767px) {

  .background-decoration {

    overflow: hidden;

  }

  .aurora-layer {

    inset: -18% -42%;

    opacity: 0.38;

  }

  .aurora-orb {

    filter: blur(30px);

  }

  .aurora-orb-1 {

    width: 58vw;

    height: 58vw;

    top: 12%;

    left: -14vw;

  }

  .aurora-orb-2 {

    width: 52vw;

    height: 52vw;

    right: -16vw;

    bottom: 18%;

  }

  .floating-ball {

    filter: blur(44px) saturate(1.16);

    opacity: 0.42;

  }

  .ball-1 {

    width: 72vw;

    height: 72vw;

    top: 4%;

    left: -28vw;

  }

  .ball-2 {

    width: 66vw;

    height: 66vw;

    top: 32%;

    right: -30vw;

  }

  .ball-3 {

    width: 64vw;

    height: 64vw;

    bottom: 8%;

    left: -24vw;

  }


}



.content-transition-enter-active,

.content-transition-leave-active {

  transition: opacity 0.3s ease, transform 0.3s ease;

}



.content-transition-enter-from,

.content-transition-leave-to {

  opacity: 0;

  transform: translateY(3px); 
}



@keyframes floatingBall1 {

  0%, 100% { transform: translate(0, 0) rotate(0deg); }

  25% { transform: translate(5%, 10%) rotate(90deg); }

  50% { transform: translate(2%, 5%) rotate(180deg); }

  75% { transform: translate(-3%, 8%) rotate(270deg); }

}



@keyframes mainBoardAurora {

  0% { background-position: 0% 0%, 100% 18%, 8% 34%, 0 0; }

  50% { background-position: 78% 20%, 38% 76%, 88% 8%, 0 0; }

  100% { background-position: 100% 76%, 0% 94%, 42% 90%, 0 0; }

}



@keyframes daylightSweep {

  0% { transform: translate3d(-12%, -4%, 0) rotate(-8deg) scale(1); opacity: 0.42; }

  45% { transform: translate3d(8%, 3%, 0) rotate(4deg) scale(1.08); opacity: 0.76; }

  100% { transform: translate3d(18%, 8%, 0) rotate(10deg) scale(1.14); opacity: 0.56; }

}



@keyframes daylightShimmer {

  0% { transform: translate3d(4%, -6%, 0) scale(1); opacity: 0.36; }

  50% { transform: translate3d(-5%, 5%, 0) scale(1.1); opacity: 0.72; }

  100% { transform: translate3d(7%, 9%, 0) scale(1.04); opacity: 0.28; }

}



@keyframes daylightAuroraRotate {

  0% { transform: rotate(0deg) scale(1); opacity: 0.3; }

  50% { transform: rotate(18deg) scale(1.08); opacity: 0.56; }

  100% { transform: rotate(-10deg) scale(1.16); opacity: 0.42; }

}



@keyframes daylightAuroraDrift {

  0% { transform: translate3d(-10%, -2%, 0) skewX(-8deg); opacity: 0.34; }

  50% { transform: translate3d(7%, 4%, 0) skewX(5deg); opacity: 0.68; }

  100% { transform: translate3d(14%, 8%, 0) skewX(10deg); opacity: 0.48; }

}



@keyframes daylightOrbFloat {

  0% { transform: translate3d(0, 0, 0) scale(0.92); opacity: 0.34; }

  45% { transform: translate3d(8vw, -4vh, 0) scale(1.16); opacity: 0.68; }

  100% { transform: translate3d(-4vw, 7vh, 0) scale(1.04); opacity: 0.46; }

}



@keyframes floatingBall2 {

  0%, 100% { transform: translate(0, 0) rotate(0deg); }

  25% { transform: translate(-8%, -5%) rotate(-90deg); }

  50% { transform: translate(-4%, -10%) rotate(-180deg); }

  75% { transform: translate(-6%, -2%) rotate(-270deg); }

}



@keyframes floatingBall3 {

  0%, 100% { transform: translate(0, 0) rotate(0deg); }

  33% { transform: translate(6%, -8%) rotate(120deg); }

  66% { transform: translate(-4%, -4%) rotate(240deg); }

  100% { transform: translate(0, 0) rotate(360deg); }

}

body.dark-theme .main-board {

  background:
    radial-gradient(circle at 10% 0%, rgba(59, 130, 246, 0.11), transparent 30%),
    radial-gradient(circle at 92% 14%, rgba(168, 85, 247, 0.09), transparent 28%),
    radial-gradient(circle at 48% 100%, rgba(99, 102, 241, 0.08), transparent 34%),
    var(--background-color);
  background-size: 145% 145%, 135% 135%, 150% 150%, 100% 100%;

}

body.dark-theme .floating-ball {

  filter: blur(96px);

  opacity: 0.22;

  mix-blend-mode: screen;

}

body.dark-theme .background-decoration {

  background: transparent;

  &::before,
  &::after {
    display: none;
  }

}

body.dark-theme .aurora-layer,
body.dark-theme .aurora-orb {

  display: none;

}



.view-wrapper {

  width: 100%;

  height: 100%;

}

body.performance-mode .main-board,
:global(body.performance-mode) .main-board {
  animation-play-state: paused;
}

body.performance-mode .background-decoration,
:global(body.performance-mode) .background-decoration {
  animation-play-state: paused;
}

body.performance-mode .content-transition-enter-active,
body.performance-mode .content-transition-leave-active,
:global(body.performance-mode) .content-transition-enter-active,
:global(body.performance-mode) .content-transition-leave-active {
  transition: opacity 0.14s ease;
}

body.performance-mode .content-transition-enter-from,
body.performance-mode .content-transition-leave-to,
:global(body.performance-mode) .content-transition-enter-from,
:global(body.performance-mode) .content-transition-leave-to {
  transform: none;
}

</style> 
