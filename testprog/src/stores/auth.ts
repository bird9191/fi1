import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, RegisterData, LoginData } from '@/types'
import { api } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  const isAuthenticated = computed(() => currentUser.value !== null)
  const isTeacher = computed(() => currentUser.value?.role === 'teacher')
  const isStudent = computed(() => currentUser.value?.role === 'student')
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  async function register(data: RegisterData): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.register(data.email, data.password, data.name, data.role)

      if (response.error) {
        error.value = response.error
        return false
      }

      if (response.data) {
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

  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUser')
    localStorage.removeItem('token')
  }

  // Восстановление сессии при загрузке страницы
  function restoreSession() {
    const saved = localStorage.getItem('currentUser')
    const token = localStorage.getItem('token')

    // Сначала восстанавливаем из localStorage (мгновенно)
    if (saved && token) {
      try {
        currentUser.value = JSON.parse(saved)
      } catch {
        localStorage.removeItem('currentUser')
      }
    }

    isInitialized.value = true

    // Затем проверяем токен на сервере (в фоне)
    if (token) {
      verifyToken()
    }
  }

  // Проверка токена на сервере (в фоновом режиме)
  async function verifyToken() {
    try {
      const response = await api.getCurrentUser()
      if (response.data) {
        // Обновляем данные пользователя с сервера
        currentUser.value = response.data.user
        localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      } else if (response.error?.includes('401') || response.error?.includes('токен') || response.error?.includes('авторизован')) {
        // Токен невалидный - выходим
        logout()
      }
      // При других ошибках (сеть и т.д.) оставляем пользователя залогиненным
    } catch {
      // Ошибка сети - оставляем пользователя залогиненным
      console.log('Failed to verify token, keeping local session')
    }
  }

  async function updateAvatar(avatarBase64: string | null) {
    if (!currentUser.value) return

    const response = await api.updateAvatar(avatarBase64)
    if (response.data) {
      currentUser.value = response.data.user
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
    }
  }

  async function updateProfile(data: { name?: string; email?: string; phone?: string }) {
    if (!currentUser.value) return false

    const response = await api.updateProfile(data)
    if (response.data) {
      currentUser.value = response.data.user
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      return true
    }
    return false
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const response = await api.changePassword(currentPassword, newPassword)
    if (response.error) {
      return { success: false, error: response.error }
    }
    return { success: true }
  }

  async function deleteAccount(): Promise<boolean> {
    if (!currentUser.value) return false

    const response = await api.deleteAccount()
    if (response.error) {
      return false
    }

    logout()
    return true
  }

  return {
    currentUser,
    isLoading,
    error,
    isAuthenticated,
    isTeacher,
    isStudent,
    isAdmin,
    isInitialized,
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
