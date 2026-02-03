/**
 * ==========================================
 * МАРШРУТИЗАЦИЯ ПРИЛОЖЕНИЯ (router)
 * ==========================================
 * 
 * Определяет все маршруты (страницы) приложения.
 * Включает защиту маршрутов (guards):
 * - requiresAuth - только для авторизованных
 * - guestOnly - только для гостей
 * - teacherOnly - только для учителей
 * - adminOnly - только для админов
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ==========================================
// СОЗДАНИЕ РОУТЕРА
// ==========================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  
  routes: [
    // ========================================
    // ПУБЛИЧНЫЕ СТРАНИЦЫ
    // ========================================
    
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Главная' }
    },
    
    {
      path: '/tests',
      name: 'tests',
      component: () => import('@/views/TestsListView.vue'),
      meta: { title: 'Каталог тестов' }
    },
    
    {
      path: '/tests/:id',
      name: 'test-details',
      component: () => import('@/views/TestDetailsView.vue'),
      meta: { title: 'Детали теста' }
    },
    
    // ========================================
    // СТРАНИЦЫ АВТОРИЗАЦИИ (только для гостей)
    // ========================================
    
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true, title: 'Вход' }
    },
    
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true, title: 'Регистрация' }
    },
    
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue'),
      meta: { guestOnly: true, title: 'Восстановление пароля' }
    },
    
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
      meta: { guestOnly: true, title: 'Новый пароль' }
    },
    
    // ========================================
    // ПОДТВЕРЖДЕНИЕ EMAIL
    // ========================================
    
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('@/views/VerifyEmailView.vue'),
      meta: { title: 'Подтверждение email' }
    },
    
    // ========================================
    // СТРАНИЦЫ ДЛЯ АВТОРИЗОВАННЫХ
    // ========================================
    
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, title: 'Панель управления' }
    },
    
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true, title: 'Мой профиль' }
    },
    
    {
      path: '/tests/:id/take',
      name: 'take-test',
      component: () => import('@/views/TakeTestView.vue'),
      meta: { requiresAuth: true, title: 'Прохождение теста' }
    },
    
    {
      path: '/results',
      name: 'results',
      component: () => import('@/views/ResultsView.vue'),
      meta: { requiresAuth: true, title: 'Мои результаты' }
    },
    
    {
      path: '/results/:id',
      name: 'result-details',
      component: () => import('@/views/ResultDetailsView.vue'),
      meta: { requiresAuth: true, title: 'Детали результата' }
    },
    
    // ========================================
    // СТРАНИЦЫ ДЛЯ УЧИТЕЛЕЙ
    // ========================================
    
    {
      path: '/tests/create',
      name: 'create-test',
      component: () => import('@/views/CreateTestView.vue'),
      meta: { requiresAuth: true, teacherOnly: true, title: 'Создание теста' }
    },
    
    {
      path: '/tests/:id/edit',
      name: 'edit-test',
      component: () => import('@/views/EditTestView.vue'),
      meta: { requiresAuth: true, teacherOnly: true, title: 'Редактирование теста' }
    },
    
    // ========================================
    // СТРАНИЦЫ ДЛЯ АДМИНОВ
    // ========================================
    
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, adminOnly: true, title: 'Админ-панель' }
    }
  ]
})

// ==========================================
// ЗАЩИТА МАРШРУТОВ (Navigation Guards)
// ==========================================

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Восстановить сессию если ещё не инициализировано
  if (!authStore.isInitialized) {
    authStore.restoreSession()
  }

  // ------------------------------------------
  // Страницы только для гостей
  // (редирект на dashboard если авторизован)
  // ------------------------------------------
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // ------------------------------------------
  // Страницы требующие авторизации
  // (редирект на login если не авторизован)
  // ------------------------------------------
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ 
      name: 'login', 
      query: { redirect: to.fullPath } // Сохраняем куда хотел попасть
    })
  }

  // ------------------------------------------
  // Страницы только для учителей
  // ------------------------------------------
  if (to.meta.teacherOnly && !authStore.isTeacher) {
    return next({ name: 'dashboard' })
  }

  // ------------------------------------------
  // Страницы только для админов
  // ------------------------------------------
  if (to.meta.adminOnly && !authStore.isAdmin) {
    return next({ name: 'dashboard' })
  }

  // Всё ок, пропускаем
  next()
})

export default router
