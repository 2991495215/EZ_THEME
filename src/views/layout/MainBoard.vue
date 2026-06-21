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
