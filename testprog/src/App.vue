<!--
  ==========================================
  ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ (App.vue)
  ==========================================
  
  Корневой компонент TestMaster.
  Отвечает за:
  - Отображение навигационной панели
  - Восстановление сессии пользователя
  - Отрисовку текущей страницы (router-view)
-->

<template>
  <div class="app">
    <AppHeader />
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

authStore.restoreSession()
</script>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
