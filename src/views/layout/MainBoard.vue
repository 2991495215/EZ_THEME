<template>

  <div class="main-board">

    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->


    

    <!-- 内容区域 - 路由视图 -->

    <div class="content-area">

      <router-view v-slot="{ Component, route }">
        <div class="view-wrapper">
          <keep-alive :include="['ShopView']" :max="1" :key="authScope">
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </div>
      </router-view>

    </div>

  </div>

</template>



<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores';
const auth = useAuthStore();
const authScope = computed(() => auth.token || 'guest');
</script>



<style lang="scss" scoped>

.main-board {

  min-height: 100vh;

  position: relative;

  overflow-x: hidden;

  z-index: 1;

  background:
    linear-gradient(180deg, rgba(var(--theme-color-rgb), 0.035), transparent 220px),
    var(--background-color);

}

:global(body.dark-theme) .main-board {
  background:
    linear-gradient(180deg, rgba(var(--theme-color-rgb), 0.06), transparent 240px),
    #171A1D;
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



.content-transition-enter-active,

.content-transition-leave-active {

  transition: opacity 0.3s ease, transform 0.3s ease;

}



.content-transition-enter-from,

.content-transition-leave-to {

  opacity: 0;

  transform: translateY(3px); 
}



.view-wrapper {

  width: 100%;

  height: 100%;

}

</style> 
