/**
 * ============================================
 * ХРАНИЛИЩЕ АВТОРИЗАЦИИ (Auth Store)
 * ============================================
 * 
 * Управляет состоянием пользователя:
 * - Вход и регистрация
 * - Восстановление сессии
 * - Управление профилем
 * - Смена пароля
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, RegisterData, LoginData } from '@/types'
import { api } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // ==========================================
  // СОСТОЯНИЕ
  // ==========================================

  /** Текущий пользователь */
  const currentUser = ref<User | null>(null)
  
  /** Флаг загрузки */
  const isLoading = ref(false)
  
  /** Текст ошибки */
  const error = ref<string | null>(null)
  
  /** Флаг инициализации (сессия восстановлена) */
  const isInitialized = ref(false)

  // ==========================================
  // ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
  // ==========================================

  /** Пользователь авторизован? */
  const isAuthenticated = computed(() => currentUser.value !== null)
  
  /** Пользователь - учитель? */
  const isTeacher = computed(() => currentUser.value?.role === 'teacher')
  
  /** Пользователь - студент? */
  const isStudent = computed(() => currentUser.value?.role === 'student')
  
  /** Пользователь - админ? */
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  // ==========================================
  // АВТОРИЗАЦИЯ
  // ==========================================

  /**
   * Регистрация нового пользователя
   */
  async function register(data: RegisterData): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.register(
        data.email, 
        data.password, 
        data.name, 
        data.role
      )

      if (response.error) {
        error.value = response.error
        return false
      }

      if (response.data) {
        // Сохраняем данные пользователя
        currentUser.value = response.data.user
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('currentUser', JSON.stringify(response.data.user))
        return true
      }

      error.value = 'Ошибка при регистрации'
      return false
    } catch (e) {
      console.error('Register error:', e)
      error.value = 'Ошибка при регистрации'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Вход в систему
   */
  async function login(data: LoginData): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.login(data.email, data.password)

      if (response.error) {
        error.value = response.error
        return false
      }

      if (response.data) {
        // Сохраняем данные пользователя
        currentUser.value = response.data.user
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('currentUser', JSON.stringify(response.data.user))
        return true
      }

      error.value = 'Неверный email или пароль'
      return false
    } catch (e) {
      console.error('Login error:', e)
      error.value = 'Ошибка при входе'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Выход из системы
   */
  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUser')
    localStorage.removeItem('token')
  }

  // ==========================================
  // ВОССТАНОВЛЕНИЕ СЕССИИ
  // ==========================================

  /**
   * Восстановить сессию из localStorage
   * Вызывается при загрузке приложения
   */
  function restoreSession() {
    const saved = localStorage.getItem('currentUser')
    const token = localStorage.getItem('token')

    // Мгновенно восстанавливаем из localStorage
    if (saved && token) {
      try {
        currentUser.value = JSON.parse(saved)
      } catch {
        localStorage.removeItem('currentUser')
      }
    }

    isInitialized.value = true

    // Проверяем токен на сервере в фоне
    if (token) {
      verifyToken()
    }
  }

  /**
   * Проверить токен на сервере (фоновая проверка)
   */
  async function verifyToken() {
    try {
      const response = await api.getCurrentUser()
      
      if (response.data) {
        // Обновляем данные с сервера
        currentUser.value = response.data.user
        localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      } else if (
        response.error?.includes('401') || 
        response.error?.includes('токен') || 
        response.error?.includes('авторизован')
      ) {
        // Токен невалидный - выходим
        logout()
      }
      // При других ошибках (сеть) оставляем пользователя
    } catch {
      console.log('Failed to verify token, keeping local session')
    }
  }

  // ==========================================
  // УПРАВЛЕНИЕ ПРОФИЛЕМ
  // ==========================================

  /**
   * Обновить аватар
   */
  async function updateAvatar(avatarBase64: string | null) {
    if (!currentUser.value) return

    const response = await api.updateAvatar(avatarBase64)
    
    if (response.data) {
      currentUser.value = response.data.user
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
    }
  }

  /**
   * Обновить профиль
   */
  async function updateProfile(data: { 
    name?: string
    email?: string
    phone?: string 
  }): Promise<boolean> {
    if (!currentUser.value) return false

    const response = await api.updateProfile(data)
    
    if (response.data) {
      currentUser.value = response.data.user
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      return true
    }
    
    return false
  }

  /**
   * Сменить пароль
   */
  async function changePassword(
    currentPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const response = await api.changePassword(currentPassword, newPassword)
    
    if (response.error) {
      return { success: false, error: response.error }
    }
    
    return { success: true }
  }

  /**
   * Удалить аккаунт
   */
  async function deleteAccount(): Promise<boolean> {
    if (!currentUser.value) return false

    const response = await api.deleteAccount()
    
    if (response.error) {
      return false
    }

    logout()
    return true
  }

  // ==========================================
  // ЭКСПОРТ
  // ==========================================

  return {
    // Состояние
    currentUser,
    isLoading,
    error,
    isInitialized,
    
    // Вычисляемые
    isAuthenticated,
    isTeacher,
    isStudent,
    isAdmin,
    
    // Методы
    register,
    login,
    logout,
    restoreSession,
    updateAvatar,
    updateProfile,
    changePassword,
    deleteAccount
  }
})
