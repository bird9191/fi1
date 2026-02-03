/**
 * ==========================================
 * ХУКАВТОРИЗАЦИИ (useAuth.ts)
 * ==========================================
 * 
 * Composable для работы с авторизацией
 */

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Хук для работы с авторизацией
 */
export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()

  // ==========================================
  // ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
  // ==========================================

  /** Авторизован ли пользователь */
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  /** Текущий пользователь */
  const user = computed(() => authStore.currentUser)

  /** Роль пользователя */
  const role = computed(() => authStore.currentUser?.role)

  /** Является ли учителем */
  const isTeacher = computed(() => authStore.isTeacher)

  /** Является ли админом */
  const isAdmin = computed(() => authStore.isAdmin)

  // ==========================================
  // МЕТОДЫ
  // ==========================================

  /**
   * Вход в систему
   */
  async function login(email: string, password: string, twoFactorCode?: string) {
    return await authStore.login(email, password, twoFactorCode)
  }

  /**
   * Регистрация
   */
  async function register(name: string, email: string, password: string, role: string) {
    return await authStore.register(name, email, password, role)
  }

  /**
   * Выход из системы
   */
  function logout() {
    authStore.logout()
    router.push('/login')
  }

  /**
   * Проверка авторизации (для guard'ов)
   */
  function requireAuth(): boolean {
    if (!isAuthenticated.value) {
      router.push('/login')
      return false
    }
    return true
  }

  /**
   * Проверка роли учителя
   */
  function requireTeacher(): boolean {
    if (!isTeacher.value) {
      router.push('/dashboard')
      return false
    }
    return true
  }

  /**
   * Проверка роли админа
   */
  function requireAdmin(): boolean {
    if (!isAdmin.value) {
      router.push('/dashboard')
      return false
    }
    return true
  }

  return {
    // Состояние
    isAuthenticated,
    user,
    role,
    isTeacher,
    isAdmin,
    
    // Методы
    login,
    register,
    logout,
    requireAuth,
    requireTeacher,
    requireAdmin
  }
}


