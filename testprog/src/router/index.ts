import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('@/views/VerifyEmailView.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tests',
      name: 'tests',
      component: () => import('@/views/TestsListView.vue')
    },
    {
      path: '/tests/create',
      name: 'create-test',
      component: () => import('@/views/CreateTestView.vue'),
      meta: { requiresAuth: true, teacherOnly: true }
    },
    {
      path: '/tests/:id',
      name: 'test-details',
      component: () => import('@/views/TestDetailsView.vue')
    },
    {
      path: '/tests/:id/take',
      name: 'take-test',
      component: () => import('@/views/TakeTestView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tests/:id/edit',
      name: 'edit-test',
      component: () => import('@/views/EditTestView.vue'),
      meta: { requiresAuth: true, teacherOnly: true }
    },
    {
      path: '/results',
      name: 'results',
      component: () => import('@/views/ResultsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/results/:id',
      name: 'result-details',
      component: () => import('@/views/ResultDetailsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, adminOnly: true }
    }
  ]
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Восстановить сессию если ещё не инициализировано
  if (!authStore.isInitialized) {
    authStore.restoreSession()
  }

  // Страницы только для гостей
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // Страницы требующие авторизации
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Страницы только для учителей
  if (to.meta.teacherOnly && !authStore.isTeacher) {
    return next({ name: 'dashboard' })
  }

  // Страницы только для админов
  if (to.meta.adminOnly && !authStore.isAdmin) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router

