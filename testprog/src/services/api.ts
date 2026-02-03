/**
 * ============================================
 * API СЕРВИС
 * ============================================
 * 
 * Централизованный сервис для всех HTTP запросов к серверу.
 * Автоматически добавляет токен авторизации к запросам.
 */

import type { User, Test, TestResult, UserAnswer, QuestionStat } from '@/types'

// URL API сервера (можно переопределить через .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ============================================
// ТИПЫ ОТВЕТОВ
// ============================================

/** Базовый ответ API */
interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

/** Ответ авторизации */
interface AuthResponse {
  user: User
  token: string
}

/** Ответ со списком тестов */
interface TestsResponse {
  tests: Test[]
}

/** Ответ со списком результатов */
interface ResultsResponse {
  results: TestResult[]
}

// ============================================
// API КЛАСС
// ============================================

class ApiService {
  /**
   * Получить токен из localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('token')
  }

  /**
   * Выполнить HTTP запрос к API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken()

    // Формируем заголовки
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Добавляем токен авторизации
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Ошибка сервера' }
      }

      return { data }
    } catch (error) {
      console.error('API Error:', error)
      return { error: 'Ошибка сети. Проверьте подключение.' }
    }
  }

  // ==========================================
  // АВТОРИЗАЦИЯ
  // ==========================================

  /** Вход в систему */
  async login(email: string, password: string) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  /** Регистрация нового пользователя */
  async register(email: string, password: string, name: string, role: string) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    })
  }

  /** Получить данные текущего пользователя */
  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me')
  }

  /** Сменить пароль */
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  // ==========================================
  // ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
  // ==========================================

  /** Обновить профиль */
  async updateProfile(data: { name?: string; email?: string; phone?: string }) {
    return this.request<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /** Обновить аватар */
  async updateAvatar(avatar: string | null) {
    return this.request<{ user: User }>('/users/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar }),
    })
  }

  /** Удалить аккаунт */
  async deleteAccount() {
    return this.request<{ message: string }>('/users/account', {
      method: 'DELETE',
    })
  }

  // ==========================================
  // ТЕСТЫ
  // ==========================================

  /** Получить публичные тесты (с поиском и фильтрами) */
  async getTests(params?: { search?: string; category?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.category) searchParams.set('category', params.category)
    const query = searchParams.toString()
    return this.request<TestsResponse>(`/tests${query ? `?${query}` : ''}`)
  }

  /** Получить тесты текущего учителя */
  async getMyTests() {
    return this.request<TestsResponse>('/tests/my')
  }

  /** Получить тест по ID */
  async getTest(id: string) {
    return this.request<{ test: Test }>(`/tests/${id}`)
  }

  /** Создать новый тест */
  async createTest(testData: Partial<Test>) {
    return this.request<{ test: Test }>('/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    })
  }

  /** Обновить тест */
  async updateTest(id: string, testData: Partial<Test>) {
    return this.request<{ test: Test }>(`/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(testData),
    })
  }

  /** Удалить тест */
  async deleteTest(id: string) {
    return this.request<{ message: string }>(`/tests/${id}`, {
      method: 'DELETE',
    })
  }

  // ==========================================
  // РЕЗУЛЬТАТЫ
  // ==========================================

  /** Отправить результат теста */
  async submitTest(
    testId: string,
    data: {
      answers: UserAnswer[]
      mode: string
      totalTime: number
      questionStats: QuestionStat[]
    }
  ) {
    return this.request<{ result: TestResult }>(`/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /** Получить результаты текущего пользователя */
  async getMyResults() {
    return this.request<ResultsResponse>('/tests/results/my')
  }

  /** Получить результаты конкретного теста (для учителя) */
  async getTestResults(testId: string) {
    return this.request<ResultsResponse>(`/tests/${testId}/results`)
  }

  // ==========================================
  // КАТЕГОРИИ
  // ==========================================

  /** Получить список категорий */
  async getCategories() {
    return this.request<{ 
      categories: Array<{ id: string; name: string; color: string }> 
    }>('/categories')
  }

  // ==========================================
  // УВЕДОМЛЕНИЯ
  // ==========================================

  /** Получить уведомления */
  async getNotifications() {
    return this.request<{ 
      notifications: Array<{ 
        id: string
        type: string
        title: string
        message: string
        isRead: boolean
        createdAt: string 
      }> 
    }>('/notifications')
  }

  /** Отметить уведомление как прочитанное */
  async markNotificationRead(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    })
  }

  // ==========================================
  // ПОДТВЕРЖДЕНИЕ EMAIL
  // ==========================================

  /** Подтвердить email по токену */
  async verifyEmail(token: string) {
    return this.request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  /** Повторно отправить письмо подтверждения */
  async resendVerification() {
    return this.request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
    })
  }

  // ==========================================
  // СБРОС ПАРОЛЯ
  // ==========================================

  /** Запросить сброс пароля */
  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  /** Установить новый пароль по токену */
  async resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  // ==========================================
  // АДМИН-ПАНЕЛЬ
  // ==========================================

  /** Получить статистику системы */
  async getAdminStats() {
    const res = await this.request<{
      totalUsers: number
      totalTests: number
      totalResults: number
      activeToday: number
      totalQuestions?: number
    }>('/admin/stats')
    
    if (res.error) throw new Error(res.error)
    return res.data!
  }

  /** Получить список пользователей */
  async getAdminUsers() {
    const res = await this.request<{ 
      users: Array<{
        id: string
        name: string
        email: string
        role: string
        createdAt: string
      }> 
    }>('/admin/users')
    
    if (res.error) throw new Error(res.error)
    return res.data!.users
  }

  /** Изменить роль пользователя */
  async updateUserRole(userId: string, role: string) {
    const res = await this.request<{ message: string }>(
      `/admin/users/${userId}/role`,
      {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }
    )
    
    if (res.error) throw new Error(res.error)
    return res.data
  }

  /** Удалить пользователя (админ) */
  async deleteUserAdmin(userId: string) {
    const res = await this.request<{ message: string }>(
      `/admin/users/${userId}`,
      { method: 'DELETE' }
    )
    
    if (res.error) throw new Error(res.error)
    return res.data
  }

  /** Отправить уведомление всем пользователям */
  async broadcastNotification(title: string, message: string, type: string) {
    const res = await this.request<{ message: string }>(
      '/admin/notifications/broadcast',
      {
        method: 'POST',
        body: JSON.stringify({ title, message, type }),
      }
    )
    
    if (res.error) throw new Error(res.error)
    return res.data
  }
}

// Экспортируем единственный экземпляр API сервиса
export const api = new ApiService()
